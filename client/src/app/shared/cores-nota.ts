export interface CorDaNota {
  readonly fundo: string;
  readonly borda: string;
  readonly chip: string;
}

/**
 * A API não guarda cor da nota, então o client escolhe uma cor pastel estável a partir
 * do id: a mesma nota tem sempre a mesma cor em qualquer dispositivo.
 */
const CORES: readonly CorDaNota[] = [
  { fundo: 'bg-note-rose', borda: 'border-note-rose-line', chip: 'bg-white/60 border-note-rose-line' },
  { fundo: 'bg-note-peach', borda: 'border-note-peach-line', chip: 'bg-white/60 border-note-peach-line' },
  { fundo: 'bg-note-butter', borda: 'border-note-butter-line', chip: 'bg-white/60 border-note-butter-line' },
  { fundo: 'bg-note-sage', borda: 'border-note-sage-line', chip: 'bg-white/60 border-note-sage-line' },
  { fundo: 'bg-note-mint', borda: 'border-note-mint-line', chip: 'bg-white/60 border-note-mint-line' },
  { fundo: 'bg-note-sky', borda: 'border-note-sky-line', chip: 'bg-white/60 border-note-sky-line' },
  { fundo: 'bg-note-lilac', borda: 'border-note-lilac-line', chip: 'bg-white/60 border-note-lilac-line' },
  { fundo: 'bg-note-cloud', borda: 'border-note-cloud-line', chip: 'bg-orchid-50 border-note-cloud-line' },
];

export function corDaNota(id: string): CorDaNota {
  let hash = 5381;

  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash + id.charCodeAt(i)) | 0;
  }

  return CORES[Math.abs(hash) % CORES.length];
}
