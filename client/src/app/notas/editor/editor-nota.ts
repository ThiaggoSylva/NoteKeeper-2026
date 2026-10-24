import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, maxLength, minLength, required } from '@angular/forms/signals';
import { LucideArchive, LucideLoaderCircle, LucideNotebookPen, LucideTrash2, LucideX } from '@lucide/angular';

import { CategoriasService } from '../../categorias/categorias.service';
import { mensagemDeErroApi } from '../../shared/erros-api';
import { corDaNota } from '../../shared/cores-nota';
import { AtualizarNotaRequest, NotaDto, StatusNota } from '../notas.models';
import { DESCRICAO_MAXIMA, TITULO_MAXIMO, TITULO_MINIMO } from '../notas.regras';
import { NotasService } from '../notas.service';
import { SeletorCategorias } from '../seletor-categorias/seletor-categorias';

interface EdicaoFormModel {
  readonly titulo: string;
  readonly descricao: string;
}

/** Janela de edição de uma nota (título, descrição, status e categorias). */
@Component({
  imports: [
    FormField,
    LucideArchive,
    LucideLoaderCircle,
    LucideNotebookPen,
    LucideTrash2,
    LucideX,
    SeletorCategorias,
  ],
  selector: 'app-editor-nota',
  templateUrl: './editor-nota.html',
  host: { '(document:keydown.escape)': 'fechar.emit()' },
})
export class EditorNota implements OnInit {
  private readonly notasService = inject(NotasService);
  protected readonly categoriasService = inject(CategoriasService);

  readonly nota = input.required<NotaDto>();

  readonly salva = output<NotaDto>();
  readonly excluir = output<NotaDto>();
  readonly fechar = output<void>();

  protected readonly descricaoMaxima = DESCRICAO_MAXIMA;
  protected readonly cor = computed(() => corDaNota(this.nota().id));

  protected readonly enviandoFormulario = signal(false);
  protected readonly mensagemErro = signal('');
  protected readonly status = signal<StatusNota>('Ativa');
  protected readonly categoriaIds = signal<readonly string[]>([]);

  protected readonly modeloEdicao = signal<EdicaoFormModel>({ titulo: '', descricao: '' });
  protected readonly formularioEdicao = form(this.modeloEdicao, (modelo) => {
    required(modelo.titulo, { message: 'Dê um título para a nota.' });
    minLength(modelo.titulo, TITULO_MINIMO, {
      message: `O título precisa ter pelo menos ${TITULO_MINIMO} caracteres.`,
    });
    maxLength(modelo.titulo, TITULO_MAXIMO, {
      message: `O título pode ter no máximo ${TITULO_MAXIMO} caracteres.`,
    });
    maxLength(modelo.descricao, DESCRICAO_MAXIMA, {
      message: `A descrição pode ter no máximo ${DESCRICAO_MAXIMA} caracteres.`,
    });
  });

  private readonly campoTitulo = viewChild<ElementRef<HTMLInputElement>>('campoTitulo');

  constructor() {
    afterNextRender(() => this.campoTitulo()?.nativeElement.focus());
  }

  ngOnInit(): void {
    const nota = this.nota();

    this.modeloEdicao.set({ titulo: nota.titulo, descricao: nota.descricao ?? '' });
    this.status.set(nota.status);
    this.categoriaIds.set(nota.categorias.map((categoria) => categoria.id));
  }

  protected salvar(event: SubmitEvent): void {
    event.preventDefault();

    const formulario = this.formularioEdicao();
    const modelo = this.modeloEdicao();
    const titulo = modelo.titulo.trim();

    if (formulario.invalid() || titulo.length < TITULO_MINIMO) {
      formulario.markAsTouched();

      if (formulario.valid() && titulo.length < TITULO_MINIMO) {
        this.mensagemErro.set(`O título precisa ter pelo menos ${TITULO_MINIMO} caracteres.`);
      }

      return;
    }

    const requisicao: AtualizarNotaRequest = {
      titulo,
      descricao: modelo.descricao.trim() || null,
      status: this.status(),
      categoriaIds: this.categoriaIds(),
    };

    this.mensagemErro.set('');
    this.enviandoFormulario.set(true);

    this.notasService.atualizar(this.nota().id, requisicao).subscribe({
      next: (nota) => {
        this.enviandoFormulario.set(false);
        this.salva.emit(nota);
      },
      error: (resposta: HttpErrorResponse) => {
        this.enviandoFormulario.set(false);
        this.mensagemErro.set(
          mensagemDeErroApi(
            resposta,
            'Não foi possível salvar a nota. Tente novamente em instantes.',
          ),
        );
      },
    });
  }
}
