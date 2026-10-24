// Em desenvolvimento o client chama /api, e o dev server encaminha para a API local
// (veja proxy.conf.json). Isso evita CORS durante o desenvolvimento.
export const environment = {
  urlApi: '/api',
};
