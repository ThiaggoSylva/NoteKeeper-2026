import { catchError, throwError } from 'rxjs';

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const accessToken = authService.sessao()?.token.accessToken;

  if (!accessToken) return next(request);

  const requisicaoAutenticada = request.clone({
    setHeaders: { Authorization: `Bearer ${accessToken}` },
  });

  return next(requisicaoAutenticada).pipe(
    catchError((erro: unknown) => {
      // Token recusado pela API (expirado, inválido ou revogado no logout): encerra a sessão.
      if (erro instanceof HttpErrorResponse && erro.status === 401) {
        authService.encerrarSessao();
      }

      return throwError(() => erro);
    }),
  );
};
