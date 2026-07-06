function toMessageParts(error: unknown) {
  if (!error || typeof error !== 'object') return []

  const maybeError = error as {
    message?: unknown
    details?: unknown
    hint?: unknown
  }

  return [maybeError.message, maybeError.details, maybeError.hint].filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0,
  )
}

export function isPermissionDeniedError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const maybeError = error as {
    code?: unknown
    message?: unknown
    details?: unknown
    hint?: unknown
  }

  if (maybeError.code === '42501') return true

  const haystack = [maybeError.message, maybeError.details, maybeError.hint]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .toLowerCase()

  return haystack.includes('permission denied')
    || haystack.includes('unauthorized')
    || haystack.includes('forbidden')
    || haystack.includes('ไม่มีสิทธิ์')
}

export function getUserFacingErrorMessage(error: unknown) {
  if (isPermissionDeniedError(error)) {
    return 'บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้ กรุณาติดต่อผู้จัดการร้าน'
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  const parts = toMessageParts(error)
  if (parts.length > 0) return parts.join('\n')

  return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}
