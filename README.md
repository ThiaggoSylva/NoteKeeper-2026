# NoteKeeper

[![.NET](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![OpenAPI / Swagger](https://img.shields.io/badge/OpenAPI%20%2F%20Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)
[![Entity Framework Core](https://img.shields.io/badge/Entity%20Framework%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://learn.microsoft.com/ef/core/)
[![ASP.NET Core Identity](https://img.shields.io/badge/ASP.NET%20Core%20Identity-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://learn.microsoft.com/aspnet/core/security/authentication/identity)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Lucide Icons](https://img.shields.io/badge/Lucide%20Icons-F56565?style=for-the-badge&logo=lucide&logoColor=white)](https://lucide.dev/)

## Introdução

O NoteKeeper é uma aplicação para registrar e organizar anotações em um só lugar. A proposta é ajudar o usuário a guardar ideias e informações importantes de forma simples e fácil de encontrar. Para isso, as informações são organizadas em categorias e notas.

## Estrutura do repositório

```
client/   Aplicação Angular 22 (Tailwind CSS 4, Signal Forms, Lucide)
server/   API ASP.NET Core (.NET 10) — Clean Architecture, testes e migrations
.github/  Workflows de deploy na Azure (API e client)
```

## Módulo de Autenticação

### Requisitos funcionais

- Permitir que um usuário crie uma conta informando nome, e-mail e senha;
- Permitir que o usuário entre na aplicação com e-mail e senha;
- Manter a sessão autenticada e permitir que o usuário encerre sua sessão;
- Exibir o nome do usuário autenticado na interface;
- Restringir o acesso às funcionalidades pessoais da aplicação a usuários autenticados.

### Regras de negócio

- **Nome:** obrigatório e utilizado para identificar o usuário na interface;
- **E-mail:** obrigatório, válido e único;
- **Senha:** obrigatória, com pelo menos 8 caracteres, incluindo um número e um caractere especial;
- Após o login, as operações protegidas devem utilizar o token de autenticação da sessão;
- Cada usuário pode acessar somente as próprias notas e categorias.

## Módulo de Categorias

### Requisitos funcionais

- Registrar novas categorias;
- Visualizar todas as categorias cadastradas;
- Editar categorias existentes;
- Excluir categorias cadastradas.

### Regras de negócio

- **Título:** obrigatório, entre 2 e 100 caracteres;
- Não é permitido cadastrar duas categorias com o mesmo título.

## Módulo de Notas

### Requisitos funcionais

- Registrar novas notas;
- Visualizar todas as notas cadastradas;
- Agrupar notas por uma ou mais categorias;
- Listar notas associadas a uma ou mais categorias especificadas;
- Editar notas existentes;
- Excluir notas cadastradas.

### Regras de negócio

- **Título:** obrigatório, entre 2 e 100 caracteres;
- **Descrição:** opcional, com até 300 caracteres;
- **Status:** ativa ou arquivada;
- Notas criadas começam com status **ativa**;
- **Categorias:** opcionais; uma nota pode não estar associada a nenhuma categoria;
- Não é permitido cadastrar duas notas com o mesmo título.

## API (server)

A API está em `server/` e usa .NET 10, ASP.NET Core Identity, JWT Bearer, EF Core e SQL Server. Para executar, configure uma connection string SQL Server e uma chave JWT (mínimo 32 bytes) usando User Secrets:

```bash
dotnet user-secrets set "ConnectionStrings:SqlServer" "<connection-string-sql-server>" --project server/src/Api/NoteKeeper.Api.csproj
dotnet user-secrets set "Jwt:SigningKey" "<chave-aleatoria-com-pelo-menos-32-bytes>" --project server/src/Api/NoteKeeper.Api.csproj
dotnet user-secrets set "LuckyPenny:LicenseKey" "<chave-de-licença-do-lucky-penny>" --project server/src/Api/NoteKeeper.Api.csproj
dotnet tool restore --tool-manifest server/dotnet-tools.json
dotnet ef database update --project server/src/Infraestrutura/NoteKeeper.Infraestrutura.csproj --startup-project server/src/Api/NoteKeeper.Api.csproj
dotnet run --project server/src/Api/NoteKeeper.Api.csproj
```

Em desenvolvimento, a API aplica as migrations na inicialização. O Swagger/OpenAPI fica disponível em `/swagger`; exemplos de chamadas estão em `server/src/Api/NoteKeeper.Api.http`.

| Método                 | Rota               | Acesso  | Operação                            |
| ---------------------- | ------------------ | ------- | ----------------------------------- |
| `POST`                 | `/auth/cadastro`   | Público | Cria conta com nome, e-mail e senha |
| `POST`                 | `/auth/login`      | Público | Autentica e retorna JWT             |
| `GET`                  | `/auth/me`         | Bearer  | Retorna os dados do usuário atual   |
| `POST`                 | `/auth/logout`     | Bearer  | Revoga imediatamente o JWT atual    |
| `GET`, `POST`          | `/categorias`      | Bearer  | Lista e cria categorias             |
| `GET`, `PUT`, `DELETE` | `/categorias/{id}` | Bearer  | Consulta, edita e exclui categoria  |
| `GET`, `POST`          | `/notas`           | Bearer  | Lista (com filtro opcional por categoria) e cria notas |
| `GET`, `PUT`, `DELETE` | `/notas/{id}`      | Bearer  | Consulta, edita e exclui nota       |

Os títulos são únicos por usuário sem diferenciar caixa ou espaços nas extremidades. A exclusão de categoria mantém as notas e remove somente as associações. O `PUT` da nota substitui a lista de categorias; use `categoriaIds: []` para remover todas. A sessão não usa refresh token: após a expiração, é necessário entrar novamente. Erros seguem `ProblemDetails` e erros de validação incluem mensagens por campo.

Para filtrar notas por categorias, informe `categoriaIds` uma vez ou mais na query string de `GET /notas`, por exemplo `GET /notas?categoriaIds=<id1>&categoriaIds=<id2>`. O filtro é exclusivo: com vários IDs, retorna somente notas associadas a **todas** as categorias informadas. Sem o parâmetro, a rota lista todas as notas do usuário autenticado.

Os casos de uso da camada de aplicação são implementados como requests e handlers do MediatR, com resultados e erros representados por FluentResults e convertidos para respostas HTTP pela API.

Build e testes:

```bash
dotnet build server/NoteKeeper.slnx --configuration Release
dotnet test server/NoteKeeper.slnx
```

## Client (front-end)

Aplicação Angular com visual inspirado no Google Keep, mas com identidade própria: paleta **orchid dusk** (lilás e orquídea como cor de marca, fundo creme e notas em tons pastel de rosa, pêssego, manteiga, sálvia, menta, céu e lilás), tipografia *Fraunces* nos títulos e *Plus Jakarta Sans* no texto.

### Tecnologias

| Tecnologia | Uso |
| --- | --- |
| Angular 22 (standalone, `@angular/build:application`) | Componentes, rotas com lazy loading e guardas funcionais |
| Signal Forms (`@angular/forms/signals`) | Formulários e validações |
| Tailwind CSS 4 (PostCSS) | Sistema de estilos: tokens de cor e fonte em `@theme` e classes reutilizáveis (`.campo`, `.botao-primario`, `.chip`...) em `styles.css` |
| `@lucide/angular` | Ícones |
| RxJS 7 | Requisições HTTP, busca e recarregamento de listas |

### Telas

| Rota | Acesso | Tela |
| --- | --- | --- |
| `/auth/login` | Visitante | Entrar com e-mail e senha (mostrar/ocultar senha) |
| `/auth/cadastro` | Visitante | Criar conta com nome, e-mail e senha, validando as regras da API |
| `/notas` | Autenticado | Notas ativas em mosaico, cartão "Criar uma nota" que expande ao clicar, busca no topo e filtro por categorias |
| `/arquivadas` | Autenticado | Notas arquivadas, com opção de desarquivar |
| `/categorias` | Autenticado | CRUD de categorias: criar, renomear na própria linha e excluir (as notas são mantidas) |

Recursos de cada tela:

- **Criar nota:** título (2 a 100 caracteres), descrição opcional (até 300, com contador) e categorias opcionais. A nota nasce com status **Ativa**.
- **Editar nota:** abre em janela, permite alterar título, descrição, status (Ativa ou Arquivada) e categorias; `categoriaIds` vazio remove todas as categorias.
- **Arquivar, desarquivar e excluir:** ações no cartão, com confirmação antes de excluir.
- **Filtrar por categorias (1 ou mais):** selecione categorias no menu lateral. O filtro vai para a URL (`?categoriaIds=a&categoriaIds=b`) e a API devolve apenas as notas que estão em **todas** as categorias marcadas.
- **Busca:** campo no topo que filtra por título, descrição e nome da categoria, ignorando acentos e maiúsculas.
- **Erros da API:** títulos repetidos (409), validações por campo (400) e falhas de conexão aparecem em mensagens claras na própria tela.
- **Sessão:** o nome do usuário aparece no topo; "Sair" chama `POST /auth/logout`, que revoga o token.

### Rotas e guardas

- `autenticadoGuard`: protege `/notas`, `/arquivadas` e `/categorias` (`canActivate` e `canActivateChild`). Sem sessão válida, redireciona para `/auth/login?returnUrl=...` e volta à página pedida após o login (apenas caminhos internos são aceitos).
- `visitanteGuard`: quem já está logado é enviado de `/auth/**` para `/notas`.
- `authInterceptor`: envia `Authorization: Bearer {token}` e encerra a sessão quando a API responde 401 (token expirado ou revogado).
- Todas as telas são carregadas sob demanda (`loadComponent`).

### Organização do código

```
client/src/app/
  auth/         guardas, interceptor, AuthService, modelos e telas de login/cadastro
  categorias/   CategoriasService (HTTP e cache em signal) e tela de gerenciamento
  notas/        NotasService, listagem, cartão, criador, editor e seletor de categorias
  layout/       moldura das telas privadas (barra superior, menu lateral e conteúdo)
  shared/       avisos (toasts), diálogo de confirmação, sidebar, topbar e tratamento de erros
```

Os componentes cuidam só da apresentação; toda a comunicação com a API fica nos serviços (`AuthService`, `CategoriasService`, `NotasService`).

### Como rodar o client

Requer Node.js compatível com Angular 22 (>= 22.22.3, 24.15+ ou 26+) e npm. Com a API rodando em `http://localhost:5146`:

```bash
cd client
npm ci
npm start
```

O client abre em `http://localhost:4200`. Em desenvolvimento ele chama `/api/...` e o dev server encaminha para a API local (`client/proxy.conf.json`), então não é preciso configurar CORS. Se a API usar outra porta, ajuste o `target` do proxy.

```bash
npm --prefix client run build   # build de produção em client/dist/notekeeper/browser
```

## Publicação na Azure

API e client são publicados **juntos, no mesmo Azure App Service**: o workflow compila o Angular e copia o resultado para o `wwwroot` do pacote da API. Como os dois ficam na mesma origem, não há CORS em produção e o client chama a API por caminhos relativos (`environment.urlApi` vazio).

Quando existe `wwwroot/index.html`, a API serve os arquivos do Angular e devolve o `index.html` quando o navegador abre uma rota do client (por exemplo, recarregar a página em `/notas` ou `/categorias`). As chamadas do Angular à API continuam chegando normalmente aos controllers. Em desenvolvimento essa pasta não existe e o client roda separado, com `npm start`.

### Recursos na Azure

1. **Azure SQL Database** (banco de dados).
2. **App Service** com runtime .NET 10 (Web App), que hospeda API e client.
3. Login do GitHub no Azure por OIDC (*Deployment Center* ou *Federated credentials*).

### Configuração no GitHub

Em *Settings → Secrets and variables → Actions → Secrets*:

| Secret | Valor |
| --- | --- |
| `AZURE_SQL_CONNECTION_STRING` | connection string do Azure SQL (usada nas migrations e no App Service) |
| `JWT_SIGNING_KEY` | chave aleatória com pelo menos 32 bytes (ex.: `openssl rand -base64 48`) |
| `LUCKYPENNY_LICENSE_KEY` | chave de licença do MediatR (Lucky Penny) |
| `AZURE_CLIENT_ID` | ID do aplicativo (client) do login OIDC |
| `AZURE_TENANT_ID` | ID do tenant |
| `AZURE_SUBSCRIPTION_ID` | ID da assinatura |
| `AZURE_RESOURCE_GROUP` | grupo de recursos do App Service |

O nome do App Service fica em `APP_NAME` no topo de `.github/workflows/main_notekeeper-2026.yml`; troque `notekeeper-2026` pelo nome do seu Web App.

### Workflow

`.github/workflows/main_notekeeper-2026.yml` roda a cada push na `main` que altere `server/**`, `client/**` ou os workflows (e também manualmente):

1. **Testes:** `dotnet test` da solução. Se falhar, nada é publicado.
2. **Build e Publish:** compila o Angular (`client/dist/notekeeper/browser`), publica a API e copia o Angular para `publish/wwwroot`.
3. **Migrations:** aplica as migrations do EF Core no Azure SQL (`dotnet ef`, versão do `server/dotnet-tools.json`).
4. **Deploy:** faz login no Azure, grava as App Settings (`ConnectionStrings__SqlServer`, `Jwt__*`, `LuckyPenny__LicenseKey`) e publica o pacote no App Service.

Depois do deploy, o app inteiro responde em `https://<app>.azurewebsites.net` (client na raiz, API em `/auth`, `/categorias` e `/notas`, Swagger em `/swagger`).
