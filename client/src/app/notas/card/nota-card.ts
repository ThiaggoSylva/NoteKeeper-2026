import { Component, computed, input, output } from '@angular/core';
import { LucideArchive, LucideArchiveRestore, LucidePencil, LucideTag, LucideTrash2 } from '@lucide/angular';

import { corDaNota } from '../../shared/cores-nota';
import { NotaDto } from '../notas.models';

@Component({
  imports: [LucideArchive, LucideArchiveRestore, LucidePencil, LucideTag, LucideTrash2],
  selector: 'app-nota-card',
  templateUrl: './nota-card.html',
})
export class NotaCard {
  readonly nota = input.required<NotaDto>();
  readonly processando = input(false);

  readonly editar = output<NotaDto>();
  readonly alternarArquivamento = output<NotaDto>();
  readonly excluir = output<NotaDto>();

  protected readonly cor = computed(() => corDaNota(this.nota().id));
  protected readonly arquivada = computed(() => this.nota().status === 'Arquivada');

  protected formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
}
