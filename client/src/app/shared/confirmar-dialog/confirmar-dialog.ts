import {
  afterNextRender,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { LucideLoaderCircle, LucideTriangleAlert } from '@lucide/angular';

/** Janela de confirmação reutilizável (exclusão de notas e categorias). */
@Component({
  imports: [LucideLoaderCircle, LucideTriangleAlert],
  selector: 'app-confirmar-dialog',
  templateUrl: './confirmar-dialog.html',
  host: { '(document:keydown.escape)': 'cancelar.emit()' },
})
export class ConfirmarDialog {
  readonly titulo = input.required<string>();
  readonly mensagem = input.required<string>();
  readonly rotuloConfirmar = input('Excluir');
  readonly processando = input(false);

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  private readonly botaoCancelar = viewChild<ElementRef<HTMLButtonElement>>('botaoCancelar');

  constructor() {
    afterNextRender(() => this.botaoCancelar()?.nativeElement.focus());
  }
}
