import { catchError, finalize, map, Observable, of, tap } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  CadastroRequest,
  LoginRequest,
  LoginResponse,
  SessaoAutenticada,
  TokenDto,
  UsuarioDto,
} from './auth.models';
import { CHAVE_ARMAZENAMENTO, URL_API } from './auth.tokens';

interface SessaoPersistidaAnteriormente {
  readonly token?: TokenDto;
  readonly usuario?: UsuarioDto;
}

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly urlApi = inject(URL_API);
  private readonly chaveArmazenamento = inject(CHAVE_ARMAZENAMENTO);

  private readonly sessaoState = signal<SessaoAutenticada | null>(this.lerSessao());
  readonly sessao = this.sessaoState.asReadonly();

  cadastrar(req: CadastroRequest): Observable<UsuarioDto> {
    return this.http.post<UsuarioDto>(`${this.urlApi}/auth/cadastro`, req);
  }

  login(req: LoginRequest): Observable<TokenDto> {
    return this.http.post<LoginResponse>(`${this.urlApi}/auth/login`, req).pipe(
      tap((resposta) => this.salvarSessao(resposta)),
      map((resposta) => this.montarToken(resposta)),
    );
  }

  /** Confirma na API que o token ainda vale e atualiza os dados do usuário (GET /auth/me). */
  atualizarUsuario(): Observable<UsuarioDto | null> {
    return this.http.get<UsuarioDto>(`${this.urlApi}/auth/me`).pipe(
      tap((usuario) => {
        const sessao = this.sessaoState();

        if (sessao) this.persistirSessao({ token: sessao.token, usuario });
      }),
      // O 401 já é tratado pelo interceptor (encerra a sessão); outros erros não derrubam a tela.
      catchError(() => of(null)),
    );
  }

  /**
   * Indica se há uma sessão ativa e não expirada. Se o token expirou com o app aberto,
   * a sessão é descartada aqui (sem navegar), para os guards decidirem o redirecionamento.
   */
  sessaoEstaValida(): boolean {
    const sessao = this.sessaoState();

    if (!sessao) return false;

    const expiracao = new Date(sessao.token.dataExpiracaoEmUtc).getTime();

    if (Number.isFinite(expiracao) && expiracao > Date.now()) return true;

    localStorage.removeItem(this.chaveArmazenamento);
    this.sessaoState.set(null);

    return false;
  }

  /** Revoga o token na API (POST /auth/logout) e, de qualquer forma, encerra a sessão local. */
  sair(): void {
    this.http
      .post<void>(`${this.urlApi}/auth/logout`, null)
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.encerrarSessao()),
      )
      .subscribe();
  }

  encerrarSessao(): void {
    localStorage.removeItem(this.chaveArmazenamento);
    this.sessaoState.set(null);

    void this.router.navigateByUrl('/auth/login');
  }

  private montarToken(resposta: LoginResponse): TokenDto {
    return {
      usuarioId: resposta.usuarioId,
      accessToken: resposta.accessToken,
      dataExpiracaoEmUtc: resposta.dataExpiracaoEmUtc,
    };
  }

  private salvarSessao(resposta: LoginResponse): void {
    this.persistirSessao({
      token: this.montarToken(resposta),
      usuario: { id: resposta.usuarioId, nome: resposta.nome, email: resposta.email },
    });
  }

  private persistirSessao(sessao: SessaoAutenticada): void {
    localStorage.setItem(this.chaveArmazenamento, JSON.stringify(sessao));
    this.sessaoState.set(sessao);
  }

  private lerSessao(): SessaoAutenticada | null {
    try {
      const dadosArmazenados = localStorage.getItem(this.chaveArmazenamento);

      if (!dadosArmazenados) return null;

      const sessaoAnterior = JSON.parse(dadosArmazenados) as SessaoPersistidaAnteriormente;

      const token = sessaoAnterior.token;
      const usuario = sessaoAnterior.usuario;

      if (!token || !usuario) {
        localStorage.removeItem(this.chaveArmazenamento);
        return null;
      }

      const expiracao = new Date(token.dataExpiracaoEmUtc).getTime();

      if (
        !token.accessToken ||
        !usuario.email ||
        !Number.isFinite(expiracao) ||
        expiracao <= Date.now()
      ) {
        localStorage.removeItem(this.chaveArmazenamento);
        return null;
      }

      return { token, usuario };
    } catch {
      localStorage.removeItem(this.chaveArmazenamento);
      return null;
    }
  }
}
