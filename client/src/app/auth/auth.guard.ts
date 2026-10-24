import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/** Bloqueia rotas privadas: sem sessão válida, vai para o login lembrando a página pedida. */
export const autenticadoGuard: CanActivateFn = (_rota, estado) => {
  if (inject(AuthService).sessaoEstaValida()) return true;

  return inject(Router).createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: estado.url },
  });
};

/** Impede quem já está logado de abrir login e cadastro de novo. */
export const visitanteGuard: CanActivateFn = () => {
  if (!inject(AuthService).sessaoEstaValida()) return true;

  return inject(Router).createUrlTree(['/notas']);
};
