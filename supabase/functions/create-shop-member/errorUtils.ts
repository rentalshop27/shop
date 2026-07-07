type ErrorLike = {
  code?: unknown
  message?: unknown
  details?: unknown
  hint?: unknown
  error_description?: unknown
}

function toNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

export function getErrorMessage(error: unknown, fallback = 'Unexpected error') {
  if (error instanceof Error && error.message.trim()) return error.message.trim()

  if (error && typeof error === 'object') {
    const errorLike = error as ErrorLike
    const parts = [
      toNonEmptyString(errorLike.message),
      toNonEmptyString(errorLike.details),
      toNonEmptyString(errorLike.hint),
      toNonEmptyString(errorLike.error_description),
    ].filter(Boolean)

    if (parts.length > 0) return parts.join('\n')

    const code = toNonEmptyString(errorLike.code)
    if (code) return code

    try {
      const serialized = JSON.stringify(error)
      if (serialized && serialized !== '{}') return serialized
    } catch {
      // Fall through to the fallback below.
    }
  }

  return fallback
}

export function isDuplicateUserError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('already been registered')
    || message.includes('already registered')
    || message.includes('user already registered')
    || message.includes('already exists')
}
