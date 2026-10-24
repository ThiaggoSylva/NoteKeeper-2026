import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { CategoriasService } from '../categorias/categorias.service';
import { Avisos } from '../shared/avisos/avisos';
import { Sidebar } from '../shared/sidebar/sidebar';
import { Topbar } from '../shared/topbar/topbar';

/** Moldura das telas privadas: barra superior, menu lateral e área de conteúdo. */
@Component({
  imports: [Avisos, RouterOutlet, Sidebar, Topbar],
  selector: 'app-shell',
  templateUrl: './app-shell.html',
})
export class AppShell {
  private readonly authService = inject(AuthService);
  private readonly categoriasService = inject(CategoriasService);

  protected readonly menuAberto = signal(typeof window === 'undefined' || window.innerWidth >= 1024);

  constructor() {
    // Confirma o token na API e carrega as categorias usadas pelo menu, criador e editor de notas.
    this.authService.atualizarUsuario().subscribe();
    this.categoriasService.listar().subscribe({ error: () => undefined });

    inject(DestroyRef).onDestroy(() => this.categoriasService.limpar());
  }

  protected alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
  }
}
