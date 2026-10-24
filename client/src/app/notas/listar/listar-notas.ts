import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideArchive,
  LucideFilterX,
  LucideRefreshCw,
  LucideSearchX,
  LucideSparkles,
  LucideX,
} from '@lucide/angular';

import { CategoriasService } from '../../categorias/categorias.service';
import { AvisosService } from '../../shared/avisos/avisos.service';
import { ConfirmarDialog } from '../../shared/confirmar-dialog/confirmar-dialog';
import { mensagemDeErroApi } from '../../shared/erros-api';
import { BuscaService, normalizarTexto } from '../busca.service';
import { NotaCard } from '../card/nota-card';
import { CriadorNota } from '../criar/criador-nota';
import { EditorNota } from '../editor/editor-nota';
import { AtualizarNotaRequest, NotaDto, StatusNota } from '../notas.models';
import { NotasService } from '../notas.service';

/** Lista de notas (ativas ou arquivadas, conforme a rota), com filtro por categorias e busca. */
@Component({
  imports: [
    ConfirmarDialog,
    CriadorNota,
    EditorNota,
    LucideArchive,
    LucideFilterX,
    LucideRefreshCw,
    LucideSearchX,
    LucideSparkles,
    LucideX,
    NotaCard,
  ],
  selector: 'app-listar-notas',
  templateUrl: './listar-notas.html',
})
export class ListarNotas {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notasService = inject(NotasService);
  private readonly avisos = inject(AvisosService);
  protected readonly categoriasService = inject(CategoriasService);
  protected readonly buscaService = inject(BuscaService);

  /** `Ativa` em /notas e `Arquivada` em /arquivadas (definido em data na rota). */
  protected readonly statusDaTela = this.route.snapshot.data['status'] as StatusNota;
  protected readonly arquivadas = this.statusDaTela === 'Arquivada';

  private readonly recarregar = new Subject<void>();

  protected readonly notas = signal<readonly NotaDto[]>([]);
  protected readonly filtrosAtivos = signal<readonly string[]>([]);
  protected readonly carregando = signal(true);
  protected readonly mensagemErro = signal('');

  protected readonly notaEmEdicao = signal<NotaDto | null>(null);
  protected readonly notaParaExcluir = signal<NotaDto | null>(null);
  protected readonly excluindo = signal(false);
  protected readonly notaProcessando = signal<string | null>(null);

  protected readonly categoriasFiltradas = computed(() =>
    this.categoriasService.categorias().filter((categoria) => this.filtrosAtivos().includes(categoria.id)),
  );

  protected readonly notasDaTela = computed(() =>
    this.notas()
      .filter((nota) => nota.status === this.statusDaTela)
      .sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()),
  );

  protected readonly notasVisiveis = computed(() => {
    const termo = normalizarTexto(this.buscaService.termo());

    if (!termo) return this.notasDaTela();

    return this.notasDaTela().filter((nota) =>
      normalizarTexto(
        [nota.titulo, nota.descricao ?? '', ...nota.categorias.map((categoria) => categoria.titulo)].join(' '),
      ).includes(termo),
    );
  });

  protected readonly temFiltro = computed(
    () => this.filtrosAtivos().length > 0 || this.buscaService.termo().trim().length > 0,
  );

  constructor() {
    combineLatest([
      this.route.queryParamMap.pipe(
        map((parametros) => parametros.getAll('categoriaIds')),
        distinctUntilChanged((a, b) => a.length === b.length && a.every((id, i) => id === b[i])),
      ),
      this.recarregar.pipe(startWith(undefined)),
    ])
      .pipe(
        tap(([categoriaIds]) => {
          this.filtrosAtivos.set(categoriaIds);
          this.carregando.set(true);
          this.mensagemErro.set('');
        }),
        switchMap(([categoriaIds]) =>
          this.notasService.listar(categoriaIds).pipe(
            catchError((resposta: HttpErrorResponse) => {
              this.mensagemErro.set(
                mensagemDeErroApi(resposta, 'Não foi possível carregar as notas. Tente novamente.'),
              );

              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((notas) => {
        if (notas) this.notas.set(notas);

        this.carregando.set(false);
      });

    // Ao sair da tela, a busca do topo volta ao vazio para não "esconder" notas na outra lista.
    this.destroyRef.onDestroy(() => this.buscaService.limpar());
  }

  protected tentarNovamente(): void {
    this.recarregar.next();
  }

  protected notaCriada(nota: NotaDto): void {
    if (this.pertenceAoFiltro(nota)) {
      this.notas.update((atuais) => [nota, ...atuais]);
    } else {
      this.avisos.sucesso('Nota criada. Ela não aparece aqui porque não está nas categorias filtradas.');
    }
  }

  protected notaSalva(nota: NotaDto): void {
    this.notas.update((atuais) =>
      this.pertenceAoFiltro(nota)
        ? atuais.map((atual) => (atual.id === nota.id ? nota : atual))
        : atuais.filter((atual) => atual.id !== nota.id),
    );

    this.notaEmEdicao.set(null);
    this.avisos.sucesso('Nota atualizada.');
  }

  protected alternarArquivamento(nota: NotaDto): void {
    const novoStatus: StatusNota = nota.status === 'Ativa' ? 'Arquivada' : 'Ativa';

    const requisicao: AtualizarNotaRequest = {
      titulo: nota.titulo,
      descricao: nota.descricao,
      status: novoStatus,
      categoriaIds: nota.categorias.map((categoria) => categoria.id),
    };

    this.notaProcessando.set(nota.id);

    this.notasService.atualizar(nota.id, requisicao).subscribe({
      next: (atualizada) => {
        this.notaProcessando.set(null);
        this.notas.update((atuais) => atuais.map((atual) => (atual.id === atualizada.id ? atualizada : atual)));
        this.avisos.sucesso(novoStatus === 'Arquivada' ? 'Nota arquivada.' : 'Nota desarquivada.');
      },
      error: (resposta: HttpErrorResponse) => {
        this.notaProcessando.set(null);
        this.avisos.erro(
          mensagemDeErroApi(resposta, 'Não foi possível alterar a nota. Tente novamente.'),
        );
      },
    });
  }

  protected pedirExclusao(nota: NotaDto): void {
    this.notaEmEdicao.set(null);
    this.notaParaExcluir.set(nota);
  }

  protected confirmarExclusao(): void {
    const nota = this.notaParaExcluir();

    if (!nota) return;

    this.excluindo.set(true);

    this.notasService.excluir(nota.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.notaParaExcluir.set(null);
        this.notas.update((atuais) => atuais.filter((atual) => atual.id !== nota.id));
        this.avisos.sucesso('Nota excluída.');
      },
      error: (resposta: HttpErrorResponse) => {
        this.excluindo.set(false);
        this.notaParaExcluir.set(null);
        this.avisos.erro(
          mensagemDeErroApi(resposta, 'Não foi possível excluir a nota. Tente novamente.'),
        );
      },
    });
  }

  protected removerFiltro(categoriaId: string): void {
    const restantes = this.filtrosAtivos().filter((id) => id !== categoriaId);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoriaIds: restantes.length > 0 ? restantes : null },
    });
  }

  protected limparFiltros(): void {
    this.buscaService.limpar();

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoriaIds: null },
    });
  }

  /** Com vários filtros, a API só devolve notas que estão em todas as categorias marcadas. */
  private pertenceAoFiltro(nota: NotaDto): boolean {
    const idsDaNota = new Set(nota.categorias.map((categoria) => categoria.id));

    return this.filtrosAtivos().every((id) => idsDaNota.has(id));
  }
}
