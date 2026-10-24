import { Service, signal } from '@angular/core';

export type TipoAviso = 'sucesso' | 'erro';

export interface Aviso {
  readonly id: number;
  readonly tipo: TipoAviso;
  readonly mensagem: string;
}

/** Mensagens rápidas ("Nota arquivada", "Categoria excluída") exibidas no canto da tela. */
@Service()
export class AvisosService {
  private proximoId = 1;
  private readonly avisosState = signal<readonly Aviso[]>([]);

  readonly avisos = this.avisosState.asReadonly();

  sucesso(mensagem: string): void {
    this.adicionar('sucesso', mensagem, 3500);
  }

  erro(mensagem: string): void {
    this.adicionar('erro', mensagem, 6000);
  }

  remover(id: number): void {
    this.avisosState.update((atuais) => atuais.filter((aviso) => aviso.id !== id));
  }

  private adicionar(tipo: TipoAviso, mensagem: string, duracaoMs: number): void {
    const id = this.proximoId++;

    this.avisosState.update((atuais) => [...atuais.slice(-2), { id, tipo, mensagem }]);

    setTimeout(() => this.remover(id), duracaoMs);
  }
}
