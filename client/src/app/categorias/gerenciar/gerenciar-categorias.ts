import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, minLength, required } from '@angular/forms/signals';
import {
  LucideCheck,
  LucideLoaderCircle,
  LucidePencil,
  LucidePlus,
  LucideTag,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';

import { TITULO_MAXIMO, TITULO_MINIMO } from '../../notas/notas.regras';
import { AvisosService } from '../../shared/avisos/avisos.service';
import { ConfirmarDialog } from '../../shared/confirmar-dialog/confirmar-dialog';
import { mensagemDeErroApi } from '../../shared/erros-api';
import { CategoriaDto } from '../categorias.models';
import { CategoriasService } from '../categorias.service';

interface CategoriaFormModel {
  readonly titulo: string;
}

/** Tela de CRUD das categorias: criar, renomear (edição na própria linha) e excluir. */
@Component({
  imports: [
    ConfirmarDialog,
    FormField,
    LucideCheck,
    LucideLoaderCircle,
    LucidePencil,
    LucidePlus,
    LucideTag,
    LucideTrash2,
    LucideX,
  ],
  selector: 'app-gerenciar-categorias',
  templateUrl: './gerenciar-categorias.html',
  host: { '(document:keydown.escape)': 'cancelarEdicao()' },
})
export class GerenciarCategorias {
  private readonly avisos = inject(AvisosService);
  protected readonly categoriasService = inject(CategoriasService);

  protected readonly tituloMaximo = TITULO_MAXIMO;

  protected readonly criando = signal(false);
  protected readonly erroCriacao = signal('');

  protected readonly modeloNova = signal<CategoriaFormModel>({ titulo: '' });
  protected readonly formularioNova = form(this.modeloNova, (modelo) => {
    required(modelo.titulo, { message: 'Informe o título da categoria.' });
    minLength(modelo.titulo, TITULO_MINIMO, {
      message: `O título precisa ter pelo menos ${TITULO_MINIMO} caracteres.`,
    });
    maxLength(modelo.titulo, TITULO_MAXIMO, {
      message: `O título pode ter no máximo ${TITULO_MAXIMO} caracteres.`,
    });
  });

  protected readonly editandoId = signal<string | null>(null);
  protected readonly salvandoEdicao = signal(false);
  protected readonly erroEdicao = signal('');

  protected readonly modeloEdicao = signal<CategoriaFormModel>({ titulo: '' });
  protected readonly formularioEdicao = form(this.modeloEdicao, (modelo) => {
    required(modelo.titulo, { message: 'Informe o título da categoria.' });
    minLength(modelo.titulo, TITULO_MINIMO, {
      message: `O título precisa ter pelo menos ${TITULO_MINIMO} caracteres.`,
    });
    maxLength(modelo.titulo, TITULO_MAXIMO, {
      message: `O título pode ter no máximo ${TITULO_MAXIMO} caracteres.`,
    });
  });

  protected readonly categoriaParaExcluir = signal<CategoriaDto | null>(null);
  protected readonly excluindo = signal(false);

  protected criar(event: SubmitEvent): void {
    event.preventDefault();

    const formulario = this.formularioNova();
    const titulo = this.modeloNova().titulo.trim();

    if (formulario.invalid() || titulo.length < TITULO_MINIMO) {
      formulario.markAsTouched();

      if (formulario.valid() && titulo.length < TITULO_MINIMO) {
        this.erroCriacao.set(`O título precisa ter pelo menos ${TITULO_MINIMO} caracteres.`);
      }

      return;
    }

    this.erroCriacao.set('');
    this.criando.set(true);

    this.categoriasService.criar({ titulo }).subscribe({
      next: (categoria) => {
        this.criando.set(false);
        this.formularioNova().reset({ titulo: '' });
        this.avisos.sucesso(`Categoria “${categoria.titulo}” criada.`);
      },
      error: (resposta: HttpErrorResponse) => {
        this.criando.set(false);
        this.erroCriacao.set(
          mensagemDeErroApi(resposta, 'Não foi possível criar a categoria. Tente novamente.'),
        );
      },
    });
  }

  protected iniciarEdicao(categoria: CategoriaDto): void {
    this.erroEdicao.set('');
    this.formularioEdicao().reset({ titulo: categoria.titulo });
    this.editandoId.set(categoria.id);
  }

  protected cancelarEdicao(): void {
    if (this.salvandoEdicao()) return;

    this.editandoId.set(null);
    this.erroEdicao.set('');
  }

  protected salvarEdicao(event: SubmitEvent, categoria: CategoriaDto): void {
    event.preventDefault();

    const formulario = this.formularioEdicao();
    const titulo = this.modeloEdicao().titulo.trim();

    if (formulario.invalid() || titulo.length < TITULO_MINIMO) {
      formulario.markAsTouched();
      return;
    }

    if (titulo === categoria.titulo) {
      this.cancelarEdicao();
      return;
    }

    this.erroEdicao.set('');
    this.salvandoEdicao.set(true);

    this.categoriasService.atualizar(categoria.id, { titulo }).subscribe({
      next: (atualizada) => {
        this.salvandoEdicao.set(false);
        this.editandoId.set(null);
        this.avisos.sucesso(`Categoria renomeada para “${atualizada.titulo}”.`);
      },
      error: (resposta: HttpErrorResponse) => {
        this.salvandoEdicao.set(false);
        this.erroEdicao.set(
          mensagemDeErroApi(resposta, 'Não foi possível salvar a categoria. Tente novamente.'),
        );
      },
    });
  }

  protected confirmarExclusao(): void {
    const categoria = this.categoriaParaExcluir();

    if (!categoria) return;

    this.excluindo.set(true);

    this.categoriasService.excluir(categoria.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.categoriaParaExcluir.set(null);
        this.avisos.sucesso(`Categoria “${categoria.titulo}” excluída.`);
      },
      error: (resposta: HttpErrorResponse) => {
        this.excluindo.set(false);
        this.categoriaParaExcluir.set(null);
        this.avisos.erro(
          mensagemDeErroApi(resposta, 'Não foi possível excluir a categoria. Tente novamente.'),
        );
      },
    });
  }
}
