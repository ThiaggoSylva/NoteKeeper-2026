import { Observer } from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowRight, LucideEye, LucideEyeOff, LucideLoaderCircle } from '@lucide/angular';

import { mensagemDeErroApi } from '../../shared/erros-api';
import { CadastroConcluidoNavigationState, LoginRequest, TokenDto } from '../auth.models';
import { AuthService } from '../auth.service';

interface LoginFormModel {
  readonly email: string;
  readonly senha: string;
}

@Component({
  imports: [FormField, LucideArrowRight, LucideEye, LucideEyeOff, LucideLoaderCircle, RouterLink],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly modeloLogin = signal<LoginFormModel>({ email: '', senha: '' });
  protected readonly formularioLogin = form(this.modeloLogin, (modelo) => {
    required(modelo.email, { message: 'Informe seu e-mail.' });
    email(modelo.email, { message: 'Informe um e-mail válido.' });
    required(modelo.senha, { message: 'Informe sua senha.' });
    minLength(modelo.senha, 8, { message: 'A senha precisa ter pelo menos 8 caracteres.' });
  });

  protected readonly mensagemSucesso = signal('');
  protected readonly mensagemErro = signal('');
  protected readonly enviandoFormulario = signal(false);
  protected readonly mostrarSenha = signal(false);

  private readonly tituloPagina = viewChild<ElementRef<HTMLHeadingElement>>('tituloPagina');

  constructor() {
    afterNextRender(() => this.tituloPagina()?.nativeElement.focus());

    const estadoNavegacao = this.router.currentNavigation()?.extras.state as
      | CadastroConcluidoNavigationState
      | undefined;

    if (estadoNavegacao?.emailCadastrado) {
      this.modeloLogin.update((original) => ({
        email: estadoNavegacao.emailCadastrado ?? '',
        senha: original.senha,
      }));

      this.mensagemSucesso.set('Conta criada com sucesso. Entre com suas credenciais para continuar.');
    }
  }

  protected enviarFormulario(event: SubmitEvent): void {
    event.preventDefault();

    const formulario = this.formularioLogin();

    if (formulario.invalid()) {
      formulario.markAsTouched();
      return;
    }

    const modelo = this.modeloLogin();

    const requisicao: LoginRequest = {
      email: modelo.email.trim(),
      senha: modelo.senha,
    };

    this.mensagemSucesso.set('');
    this.mensagemErro.set('');
    this.enviandoFormulario.set(true);

    const observer: Partial<Observer<TokenDto>> = {
      next: () => {
        this.enviandoFormulario.set(false);

        void this.router.navigateByUrl(this.obterUrlDeRetorno());
      },
      error: (response: HttpErrorResponse) => {
        this.enviandoFormulario.set(false);

        this.mensagemErro.set(
          response.status === 401
            ? 'E-mail ou senha incorretos. Depois de 5 tentativas erradas, a conta fica bloqueada por 5 minutos.'
            : mensagemDeErroApi(
                response,
                'Não foi possível entrar agora. Tente novamente em instantes.',
              ),
        );
      },
    };

    this.authService.login(requisicao).subscribe(observer);
  }

  /** Só aceita caminhos internos (começando com uma única "/") para evitar redirecionamento externo. */
  private obterUrlDeRetorno(): string {
    const retorno = this.route.snapshot.queryParamMap.get('returnUrl');

    return retorno && retorno.startsWith('/') && !retorno.startsWith('//') ? retorno : '/notas';
  }
}
