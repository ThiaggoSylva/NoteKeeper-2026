import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, Routes, withInMemoryScrolling } from '@angular/router';

import { environment } from '../environments/environment';
import { autenticadoGuard, visitanteGuard } from './auth/auth.guard';
import { authInterceptor } from './auth/auth.interceptor';
import { CHAVE_ARMAZENAMENTO, URL_API } from './auth/auth.tokens';

const routes: Routes = [
  { path: '', redirectTo: 'notas', pathMatch: 'full' },
  {
    // Telas públicas: quem já está logado é enviado para as notas (visitanteGuard).
    path: 'auth',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./auth/shell/auth-shell').then((c) => c.AuthShell),
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login').then((c) => c.Login),
      },
      {
        path: 'cadastro',
        loadComponent: () => import('./auth/cadastro/cadastro').then((c) => c.Cadastro),
      },
    ],
  },
  {
    // Telas privadas: exigem sessão válida; sem ela vão para /auth/login?returnUrl=...
    path: '',
    canActivate: [autenticadoGuard],
    canActivateChild: [autenticadoGuard],
    loadComponent: () => import('./layout/app-shell').then((c) => c.AppShell),
    children: [
      {
        path: 'notas',
        data: { status: 'Ativa' },
        loadComponent: () => import('./notas/listar/listar-notas').then((c) => c.ListarNotas),
      },
      {
        path: 'arquivadas',
        data: { status: 'Arquivada' },
        loadComponent: () => import('./notas/listar/listar-notas').then((c) => c.ListarNotas),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./categorias/gerenciar/gerenciar-categorias').then((c) => c.GerenciarCategorias),
      },
    ],
  },
  { path: '**', redirectTo: 'notas' },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: URL_API,
      useValue: environment.urlApi,
    },
    {
      provide: CHAVE_ARMAZENAMENTO,
      useValue: 'notekeeper.sessao',
    },
  ],
};
