export function parseProductColors(value: unknown): string[] {
  if (Array.isArray(value)) {
    return dedupeTrimmedColors(value.filter((entry): entry is string => typeof entry === 'string'))
  }

  if (typeof value === 'string') {
    return dedupeTrimmedColors(value.split(','))
  }

  return []
}

export function formatProductColors(value: unknown): string {
  return parseProductColors(value).join(', ')
}

function dedupeTrimmedColors(values: string[]) {
  const seen = new Set<string>()
  const normalized: string[] = []

  values.forEach((value) => {
    const trimmed = value.trim()
    if (!trimmed || seen.has(trimmed)) return
    seen.add(trimmed)
    normalized.push(trimmed)
  })

  return normalized
}
