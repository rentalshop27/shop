export function resolveGoogleRefreshToken(
  newRefreshToken: string | undefined,
  existingRefreshToken: string | null | undefined,
) {
  const refreshToken = newRefreshToken?.trim() || existingRefreshToken?.trim()
  if (!refreshToken) {
    throw new Error('Google did not return a refresh token')
  }

  return refreshToken
}
