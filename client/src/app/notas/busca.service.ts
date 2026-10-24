import { Service, signal } from '@angular/core';

/** Termo digitado na busca do topo; a lista de notas filtra por ele no próprio client. */
@Service()
export class BuscaService {
  private readonly termoState = signal('');
  readonly termo = this.termoState.asReadonly();

  definir(termo: string): void {
    this.termoState.set(termo);
  }

  limpar(): void {
    this.termoState.set('');
  }
}

/** Remove acentos e ignora maiúsculas para comparar textos na busca. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
