import { describe, expect, it } from 'vitest'
import { resolveGoogleRefreshToken } from '../../../supabase/functions/_shared/googleToken'

describe('resolveGoogleRefreshToken', () => {
  it('preserves the stored refresh token when Google omits it during reconnect', () => {
    expect(resolveGoogleRefreshToken(undefined, 'stored-refresh-token')).toBe('stored-refresh-token')
  })

  it('uses a newly issued refresh token when Google returns one', () => {
    expect(resolveGoogleRefreshToken('new-refresh-token', 'stored-refresh-token')).toBe('new-refresh-token')
  })

  it('rejects a connection that has no usable refresh token', () => {
    expect(() => resolveGoogleRefreshToken(undefined, null)).toThrow('Google did not return a refresh token')
  })
})
