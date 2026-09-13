const SWATCH_CLASS: Record<string, string> = {
  Noir: 'bg-ink',
  Blanc: 'bg-paper ring-1 ring-ink/25',
}

export function swatchClass(colour: string): string {
  return SWATCH_CLASS[colour] ?? 'bg-neutral-300'
}
