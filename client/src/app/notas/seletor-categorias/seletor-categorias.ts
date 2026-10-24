import { Component, input, output } from '@angular/core';
import { LucideCheck, LucideTag } from '@lucide/angular';

import { CategoriaDto } from '../../categorias/categorias.models';

/** Chips de categorias selecionáveis; usado no criador e no editor de notas. */
@Component({
  imports: [LucideCheck, LucideTag],
  selector: 'app-seletor-categorias',
  templateUrl: './seletor-categorias.html',
})
export class SeletorCategorias {
  readonly categorias = input.required<readonly CategoriaDto[]>();
  readonly selecionadas = input.required<readonly string[]>();

  readonly alterar = output<readonly string[]>();

  protected alternar(categoriaId: string): void {
    const atuais = this.selecionadas();

    this.alterar.emit(
      atuais.includes(categoriaId)
        ? atuais.filter((id) => id !== categoriaId)
        : [...atuais, categoriaId],
    );
  }
}
