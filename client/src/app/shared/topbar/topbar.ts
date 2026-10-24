import { Component, computed, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideLogOut, LucideMenu, LucideNotebookPen, LucideSearch, LucideX } from '@lucide/angular';

import { AuthService } from '../../auth/auth.service';
import { BuscaService } from '../../notas/busca.service';

@Component({
  imports: [LucideLogOut, LucideMenu, LucideNotebookPen, LucideSearch, LucideX, RouterLink],
  selector: 'app-topbar',
  templateUrl: './topbar.html',
})
export class Topbar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly buscaService = inject(BuscaService);

  readonly alternarMenu = output<void>();

  protected readonly usuario = computed(() => this.authService.sessao()?.usuario ?? null);
  protected readonly inicial = computed(() => (this.usuario()?.nome ?? '?').trim().charAt(0).toUpperCase());

  /** A busca só filtra notas; na tela de categorias ela fica escondida. */
  protected readonly buscaVisivel = computed(() => !this.router.url.startsWith('/categorias'));

  protected sair(): void {
    this.authService.sair();
  }
}
