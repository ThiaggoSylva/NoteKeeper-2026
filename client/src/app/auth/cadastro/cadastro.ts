import { Observer } from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { email, form, FormField, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowRight, LucideEye, LucideEyeOff, LucideLoaderCircle } from '@lucide/angular';

import { mensagemDeErroApi } from '../../shared/erros-api';
import { CadastroConcluidoNavigationState, CadastroRequest, UsuarioDto } from '../auth.models';
import { AuthService } from '../auth.service';

interface CadastroFormModel {
  readonly nome: string;
  readonly email: string;
  readonly senha: string;
}

@Component({
  imports: [FormField, LucideArrowRight, LucideEye, LucideEyeOff, LucideLoaderCircle, RouterLink],
  selector: 'app-cadastro',
  templateUrl: './cadastro.html',
})
export class Cadastro {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly tituloPagina = viewChild<ElementRef<HTMLHeadingElement>>('tituloPagina');

  protected readonly modeloCadastro = signal<CadastroFormModel>({ nome: '', email: '', senha: '' });
  protected readonly formularioCadastro = form(this.modeloCadastro, (modelo) => {
    required(modelo.nome, { message: 'Informe seu nome.' });
    minLength(modelo.nome, 2, { message: 'O nome precisa ter pelo menos 2 caracteres.' });
    maxLength(modelo.nome, 100, { message: 'O nome pode ter no máximo 100 caracteres.' });
    required(modelo.email, { message: 'Informe seu e-mail.' });
    email(modelo.email, { message: 'Informe um e-mail válido.' });
    required(modelo.senha, { message: 'Informe sua senha.' });
    minLength(modelo.senha, 8, { message: 'A senha precisa ter pelo menos 8 caracteres.' });
    pattern(modelo.senha, /(?=.*\d)(?=.*[^\p{L}\d]).+/u, {
      message: 'Inclua pelo menos um número e um caractere especial.',
    });
  });

  protected readonly mensagemErro = signal('');
  protected readonly enviandoFormulario = signal(false);
  protected readonly mostrarSenha = signal(false);

  constructor() {
    afterNextRender(() => this.tituloPagina()?.nativeElement.focus());
  }

  protected enviarFormulario(event: SubmitEvent): void {
    event.preventDefault();

    const formulario = this.formularioCadastro();

    if (formulario.invalid()) {
      formulario.markAsTouched();
      return;
    }

    const modelo = this.modeloCadastro();

    const requisicao: CadastroRequest = {
      nome: modelo.nome.trim(),
      email: modelo.email.trim(),
      senha: modelo.senha,
    };

    this.mensagemErro.set('');
    this.enviandoFormulario.set(true);

    const observer: Partial<Observer<UsuarioDto>> = {
      next: (usuario) => {
        this.enviandoFormulario.set(false);

        const estadoNavegacao: CadastroConcluidoNavigationState = {
          emailCadastrado: usuario.email,
        };

        void this.router.navigateByUrl('/auth/login', { state: estadoNavegacao });
      },
      error: (response: HttpErrorResponse) => {
        this.enviandoFormulario.set(false);

        this.mensagemErro.set(
          response.status === 409
            ? 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.'
            : mensagemDeErroApi(response, 'Não foi possível criar sua conta. Tente novamente em instantes.'),
        );
      },
    };

    this.authService.cadastrar(requisicao).subscribe(observer);
  }
}
