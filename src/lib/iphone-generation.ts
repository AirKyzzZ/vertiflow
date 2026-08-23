function iPhoneGeneration(model: string): string {
  const match = /^iPhone (\d+)/.exec(model)
  return match ? `iPhone ${match[1]}` : model
}

export function groupByGeneration(models: string[]): Array<[string, string[]]> {
  const groups = new Map<string, string[]>()
  for (const model of models) {
    const generation = iPhoneGeneration(model)
    const existing = groups.get(generation)
    if (existing) existing.push(model)
    else groups.set(generation, [model])
  }
  return [...groups.entries()]
}
