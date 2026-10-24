/** Item de GET /categorias e resposta de POST/PUT /categorias. */
export interface CategoriaDto {
  readonly id: string;
  readonly titulo: string;
}

export interface CategoriaRequest {
  readonly titulo: string;
}
