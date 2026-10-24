// Produção: o client é publicado dentro do wwwroot da própria API (mesma origem), então as
// chamadas usam caminhos relativos e urlApi fica vazio. Não precisa de CORS.
export const environment = {
  urlApi: '',
};
