import { Observable } from 'rxjs';

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';

import { URL_API } from '../auth/auth.tokens';
import { AtualizarNotaRequest, CriarNotaRequest, NotaDto } from './notas.models';

@Service()
export class NotasService {
  private readonly http = inject(HttpClient);
  private readonly urlApi = inject(URL_API);

  /**
   * Com várias categorias, a API devolve apenas as notas que pertencem a TODAS elas
   * (`?categoriaIds=a&categoriaIds=b`). Sem categorias, devolve todas as notas do usuário.
   */
  listar(categoriaIds: readonly string[]): Observable<readonly NotaDto[]> {
    let params = new HttpParams();

    for (const categoriaId of categoriaIds) {
      params = params.append('categoriaIds', categoriaId);
    }

    return this.http.get<readonly NotaDto[]>(`${this.urlApi}/notas`, { params });
  }

  obterPorId(notaId: string): Observable<NotaDto> {
    return this.http.get<NotaDto>(`${this.urlApi}/notas/${notaId}`);
  }

  criar(requisicao: CriarNotaRequest): Observable<NotaDto> {
    return this.http.post<NotaDto>(`${this.urlApi}/notas`, requisicao);
  }

  atualizar(notaId: string, requisicao: AtualizarNotaRequest): Observable<NotaDto> {
    return this.http.put<NotaDto>(`${this.urlApi}/notas/${notaId}`, requisicao);
  }

  excluir(notaId: string): Observable<void> {
    return this.http.delete<void>(`${this.urlApi}/notas/${notaId}`);
  }
}
