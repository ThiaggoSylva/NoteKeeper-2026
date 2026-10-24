import { filter, map } from 'rxjs';

import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideArchive,
  LucideFilterX,
  LucideStickyNote,
  LucideTag,
  LucideTags,
} from '@lucide/angular';

import { CategoriasService } from '../../categorias/categorias.service';

@Component({
  imports: [
    LucideArchive,
    LucideFilterX,
    LucideStickyNote,
    LucideTag,
    LucideTags,
    RouterLink,
    RouterLinkActive,
  ],
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly categoriasService = inject(CategoriasService);

  readonly aberto = input.required<boolean>();
  readonly fechar = output<void>();

  private readonly urlAtual = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  /** Categorias marcadas como filtro (vêm da URL, então o filtro sobrevive ao recarregar). */
  protected readonly filtrosAtivos = computed<readonly string[]>(() => {
    const existentes = new Set(this.categoriasService.categorias().map((categoria) => categoria.id));

    return this.queryParams()
      .getAll('categoriaIds')
      .filter((id) => existentes.has(id));
  });

  /** Os filtros valem para a lista que o usuário está vendo (ativas ou arquivadas). */
  private readonly rotaDeNotas = computed(() =>
    this.urlAtual().startsWith('/arquivadas') ? '/arquivadas' : '/notas',
  );

  protected alternarCategoria(categoriaId: string): void {
    const ativos = this.filtrosAtivos();
    const novos = ativos.includes(categoriaId)
      ? ativos.filter((id) => id !== categoriaId)
      : [...ativos, categoriaId];

    void this.navegarComFiltros(novos);
  }

  protected limparFiltros(): void {
    void this.navegarComFiltros([]);
  }

  protected aoNavegar(): void {
    // No celular o menu é uma gaveta: fecha depois de escolher um destino.
    if (typeof window !== 'undefined' && window.innerWidth < 1024) this.fechar.emit();
  }

  private navegarComFiltros(categoriaIds: readonly string[]): Promise<boolean> {
    this.aoNavegar();

    return this.router.navigate([this.rotaDeNotas()], {
      queryParams: { categoriaIds: categoriaIds.length > 0 ? categoriaIds : null },
    });
  }
}
