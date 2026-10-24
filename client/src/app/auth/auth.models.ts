export interface CadastroRequest {
  readonly nome: string;
  readonly email: string;
  readonly senha: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly senha: string;
}

/** Resposta de POST /auth/cadastro e GET /auth/me. */
export interface UsuarioDto {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
}

/** Resposta de POST /auth/login. */
export interface LoginResponse {
  readonly usuarioId: string;
  readonly nome: string;
  readonly email: string;
  readonly accessToken: string;
  readonly dataExpiracaoEmUtc: string;
}

/** Token usado internamente pelo client. */
export interface TokenDto {
  readonly usuarioId: string;
  readonly accessToken: string;
  readonly dataExpiracaoEmUtc: string;
}

export interface SessaoAutenticada {
  readonly token: TokenDto;
  readonly usuario: UsuarioDto;
}

export interface CadastroConcluidoNavigationState {
  readonly emailCadastrado?: string;
}
