import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getGoogleOAuthCallbackUrl,
  getGoogleOAuthReturnUrl,
  getGoogleOAuthSetupState,
} from './googleOAuth'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('googleOAuth helpers', () => {
  it('builds the Supabase callback URL from env', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc123.supabase.co')

    expect(getGoogleOAuthCallbackUrl()).toBe('https://abc123.supabase.co/functions/v1/google-oauth-callback')
  })

  it('falls back to the public app url when window is unavailable', () => {
    vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://app.precious.test/')

    expect(getGoogleOAuthReturnUrl()).toBe('https://app.precious.test/?tab=profile')
    expect(getGoogleOAuthReturnUrl('shop_1')).toBe('https://app.precious.test/?tab=profile&shopId=shop_1')
  })

  it('does not allow OAuth start until config and shop are present', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc123.supabase.co')

    expect(getGoogleOAuthSetupState(null).canStartOAuth).toBe(false)
    expect(getGoogleOAuthSetupState('shop_1').canStartOAuth).toBe(true)
  })
})
