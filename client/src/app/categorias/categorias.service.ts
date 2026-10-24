import { Observable, tap } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';

import { URL_API } from '../auth/auth.tokens';
import { CategoriaDto, CategoriaRequest } from './categorias.models';

/**
 * Comunicação com /categorias. Também mantém a lista em memória (signal) para que a barra
 * lateral, o criador de notas e o editor enxerguem as mesmas categorias sem pedir de novo.
 */
@Service()
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly urlApi = inject(URL_API);

  private readonly categoriasState = signal<readonly CategoriaDto[]>([]);
  private readonly carregadasState = signal(false);

  readonly categorias = this.categoriasState.asReadonly();
  readonly carregadas = this.carregadasState.asReadonly();

  listar(): Observable<readonly CategoriaDto[]> {
    return this.http.get<readonly CategoriaDto[]>(`${this.urlApi}/categorias`).pipe(
      tap((categorias) => {
        this.categoriasState.set(this.ordenar(categorias));
        this.carregadasState.set(true);
      }),
    );
  }

  criar(requisicao: CategoriaRequest): Observable<CategoriaDto> {
    return this.http.post<CategoriaDto>(`${this.urlApi}/categorias`, requisicao).pipe(
      tap((categoria) => this.categoriasState.update((atuais) => this.ordenar([...atuais, categoria]))),
    );
  }

  atualizar(categoriaId: string, requisicao: CategoriaRequest): Observable<CategoriaDto> {
    return this.http
      .put<CategoriaDto>(`${this.urlApi}/categorias/${categoriaId}`, requisicao)
      .pipe(
        tap((categoria) =>
          this.categoriasState.update((atuais) =>
            this.ordenar(atuais.map((atual) => (atual.id === categoria.id ? categoria : atual))),
          ),
        ),
      );
  }

  excluir(categoriaId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.urlApi}/categorias/${categoriaId}`)
      .pipe(
        tap(() =>
          this.categoriasState.update((atuais) => atuais.filter((atual) => atual.id !== categoriaId)),
        ),
      );
  }

  /** Limpa o cache ao sair, para outro usuário nunca ver categorias do anterior. */
  limpar(): void {
    this.categoriasState.set([]);
    this.carregadasState.set(false);
  }

  private ordenar(categorias: readonly CategoriaDto[]): readonly CategoriaDto[] {
    return [...categorias].sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  }
}
