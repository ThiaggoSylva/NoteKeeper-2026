import { HttpErrorResponse } from '@angular/common/http';

/** Formato dos erros da API (ProblemDetails; erros de validação trazem `errors` por campo). */
export interface ApiProblemDetails {
  readonly title?: string;
  readonly detail?: string;
  readonly errors?: Record<string, string[]>;
}

/** Converte a resposta de erro da API em uma mensagem pronta para exibir ao usuário. */
export function mensagemDeErroApi(resposta: HttpErrorResponse, mensagemPadrao: string): string {
  if (resposta.status === 0) {
    return 'Não foi possível conectar à API. Verifique sua conexão e tente novamente.';
  }

  const problema = resposta.error as ApiProblemDetails | null;

  if (problema?.errors) {
    const mensagens = [...new Set(Object.values(problema.errors).flat())];

    if (mensagens.length > 0) return mensagens.join('\n');
  }

  return problema?.detail ?? mensagemPadrao;
}
