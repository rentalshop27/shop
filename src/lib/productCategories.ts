export function parseProductCategories(value: unknown): string[] {
  if (Array.isArray(value)) {
    return dedupeTrimmedCategories(value.filter((entry): entry is string => typeof entry === 'string'))
  }

  if (typeof value === 'string') {
    return dedupeTrimmedCategories(value.split(','))
  }

  return []
}

export function formatProductCategories(value: unknown): string {
  return parseProductCategories(value).join(', ')
}

function dedupeTrimmedCategories(values: string[]) {
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
