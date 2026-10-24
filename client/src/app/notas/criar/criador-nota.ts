import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  ElementRef,
  Injector,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, maxLength, minLength, required } from '@angular/forms/signals';
import { LucideLoaderCircle, LucidePlus } from '@lucide/angular';

import { CategoriasService } from '../../categorias/categorias.service';
import { AvisosService } from '../../shared/avisos/avisos.service';
import { mensagemDeErroApi } from '../../shared/erros-api';
import { CriarNotaRequest, NotaDto } from '../notas.models';
import { DESCRICAO_MAXIMA, TITULO_MAXIMO, TITULO_MINIMO } from '../notas.regras';
import { NotasService } from '../notas.service';
import { SeletorCategorias } from '../seletor-categorias/seletor-categorias';

interface NotaFormModel {
  readonly titulo: string;
  readonly descricao: string;
}

const MODELO_VAZIO: NotaFormModel = { titulo: '', descricao: '' };

/** Cartão "Criar uma nota..." no estilo do Google Keep: fechado vira um campo, aberto vira o formulário. */
@Component({
  imports: [FormField, LucideLoaderCircle, LucidePlus, SeletorCategorias],
  selector: 'app-criador-nota',
  templateUrl: './criador-nota.html',
  host: { '(document:keydown.escape)': 'fechar()' },
})
export class CriadorNota {
  private readonly notasService = inject(NotasService);
  private readonly avisos = inject(AvisosService);
  protected readonly categoriasService = inject(CategoriasService);

  readonly criada = output<NotaDto>();

  protected readonly descricaoMaxima = DESCRICAO_MAXIMA;
  protected readonly expandido = signal(false);
  protected readonly enviandoFormulario = signal(false);
  protected readonly mensagemErro = signal('');
  protected readonly categoriaIds = signal<readonly string[]>([]);

  protected readonly modeloNota = signal<NotaFormModel>(MODELO_VAZIO);
  protected readonly formularioNota = form(this.modeloNota, (modelo) => {
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

  protected abrir(): void {
    this.expandido.set(true);

    afterNextRender(() => this.campoTitulo()?.nativeElement.focus(), { injector: this.injector });
  }

  protected fechar(): void {
    if (!this.expandido() || this.enviandoFormulario()) return;

    this.expandido.set(false);
    this.limpar();
  }

  protected salvar(event: SubmitEvent): void {
    event.preventDefault();

    const formulario = this.formularioNota();
    const modelo = this.modeloNota();
    const titulo = modelo.titulo.trim();

    if (formulario.invalid() || titulo.length < TITULO_MINIMO) {
      formulario.markAsTouched();

      if (formulario.valid() && titulo.length < TITULO_MINIMO) {
        this.mensagemErro.set(`O título precisa ter pelo menos ${TITULO_MINIMO} caracteres.`);
      }

      return;
    }

    const requisicao: CriarNotaRequest = {
      titulo,
      descricao: modelo.descricao.trim() || null,
      categoriaIds: this.categoriaIds(),
    };

    this.mensagemErro.set('');
    this.enviandoFormulario.set(true);

    this.notasService.criar(requisicao).subscribe({
      next: (nota) => {
        this.enviandoFormulario.set(false);
        this.expandido.set(false);
        this.limpar();

        this.avisos.sucesso('Nota criada.');
        this.criada.emit(nota);
      },
      error: (resposta: HttpErrorResponse) => {
        this.enviandoFormulario.set(false);
        this.mensagemErro.set(
          mensagemDeErroApi(resposta, 'Não foi possível criar a nota. Tente novamente em instantes.'),
        );
      },
    });
  }

  private limpar(): void {
    this.formularioNota().reset(MODELO_VAZIO);
    this.categoriaIds.set([]);
    this.mensagemErro.set('');
  }

  private readonly injector = inject(Injector);
}
