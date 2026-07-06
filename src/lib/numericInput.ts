type SanitizeNumericInputOptions = {
  allowDecimal?: boolean
}

export function sanitizeNumericInput(
  value: string,
  options: SanitizeNumericInputOptions = {},
) {
  const { allowDecimal = true } = options
  const cleaned = value.replace(/[^\d.]/g, '')

  if (!allowDecimal) {
    return cleaned.replace(/\./g, '')
  }

  if (!cleaned) {
    return ''
  }

  const [integerPart, ...decimalParts] = cleaned.split('.')

  if (decimalParts.length === 0) {
    return integerPart
  }

  const normalizedIntegerPart = integerPart || '0'
  return `${normalizedIntegerPart}.${decimalParts.join('')}`
}
