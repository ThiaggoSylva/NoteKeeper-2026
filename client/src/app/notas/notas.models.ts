import { CategoriaDto } from '../categorias/categorias.models';

export type StatusNota = 'Ativa' | 'Arquivada';

/** Item de GET /notas e resposta de GET/POST/PUT /notas/{id}. */
export interface NotaDto {
  readonly id: string;
  readonly titulo: string;
  readonly descricao: string | null;
  readonly status: StatusNota;
  readonly categorias: readonly CategoriaDto[];
  readonly criadoEm: string;
  readonly atualizadoEm: string;
}

/** POST /notas: a nota nasce sempre com status Ativa. */
export interface CriarNotaRequest {
  readonly titulo: string;
  readonly descricao: string | null;
  readonly categoriaIds: readonly string[];
}

/** PUT /notas/{id}: substitui os campos e a lista de categorias (vazia remove todas). */
export interface AtualizarNotaRequest {
  readonly titulo: string;
  readonly descricao: string | null;
  readonly status: StatusNota;
  readonly categoriaIds: readonly string[];
}
