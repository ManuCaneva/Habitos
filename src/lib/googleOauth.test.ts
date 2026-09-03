import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generatePkce,
  buildAuthUrl,
  parseOAuthCallbackQuery,
  buildTokenExchangePayload,
  buildRefreshPayload,
} from './googleOauth'

describe('googleOauth', () => {
  describe('generatePkce', () => {
    beforeEach(() => {
      vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
        const arr = array as Uint8Array
        for (let i = 0; i < arr.length; i++) {
          arr[i] = i % 256
        }
        return arr
      })
      const emptyBuffer = new ArrayBuffer(32)
      vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(emptyBuffer)
    })

    it('retorna verifier y challenge strings', async () => {
      const pair = await generatePkce()
      expect(pair.verifier).toBeTruthy()
      expect(pair.challenge).toBeTruthy()
      expect(typeof pair.verifier).toBe('string')
      expect(typeof pair.challenge).toBe('string')
    })
  })

  describe('buildAuthUrl', () => {
    it('construye la URL de consentimiento de Google', () => {
      const url = buildAuthUrl({
        clientId: '123.apps.googleusercontent.com',
        redirectUri: 'com.aeon://oauth/callback',
        scope: 'https://www.googleapis.com/auth/calendar',
        state: 'xyz123',
        codeChallenge: 'challenge123',
      })
      expect(url).toContain('accounts.google.com/o/oauth2/v2/auth')
      expect(url).toContain('client_id=123.apps.googleusercontent.com')
      expect(url).toContain('redirect_uri=com.aeon%3A%2F%2Foauth%2Fcallback')
      expect(url).toContain('code_challenge=challenge123')
      expect(url).toContain('code_challenge_method=S256')
      expect(url).toContain('state=xyz123')
      expect(url).toContain('response_type=code')
      expect(url).toContain('access_type=offline')
    })
  })

  describe('parseOAuthCallbackQuery', () => {
    it('decodifica una query cruda exactamente una vez', () => {
      const result = parseOAuthCallbackQuery('code=4%2F0AVG%2Babc&state=xyz')
      expect(result.code).toBe('4/0AVG+abc')
      expect(result.state).toBe('xyz')
      expect(result.error).toBeUndefined()
    })

    it('extrae error cuando Google lo envía', () => {
      const result = parseOAuthCallbackQuery('error=access_denied&state=xyz')
      expect(result.error).toBe('access_denied')
      expect(result.code).toBeUndefined()
    })

    it('retorna undefined para params faltantes', () => {
      const result = parseOAuthCallbackQuery('')
      expect(result.code).toBeUndefined()
      expect(result.error).toBeUndefined()
      expect(result.state).toBeUndefined()
    })

    it('no lanza con una query malformada', () => {
      const result = parseOAuthCallbackQuery('code=%E0%A4%A')
      expect(result.code).toBe('\uFFFD%A')
      expect(result.error).toBeUndefined()
      expect(result.state).toBeUndefined()
    })
  })

  describe('buildTokenExchangePayload', () => {
    it('construye el payload para intercambio de código', () => {
      const payload = buildTokenExchangePayload({
        code: 'authcode123',
        clientId: '123.apps.googleusercontent.com',
        redirectUri: 'com.aeon://oauth/callback',
        codeVerifier: 'verifier123',
      })
      expect(payload.get('code')).toBe('authcode123')
      expect(payload.get('client_id')).toBe('123.apps.googleusercontent.com')
      expect(payload.has('client_secret')).toBe(false)
      expect(payload.get('redirect_uri')).toBe('com.aeon://oauth/callback')
      expect(payload.get('code_verifier')).toBe('verifier123')
      expect(payload.get('grant_type')).toBe('authorization_code')
    })
  })

  describe('buildRefreshPayload', () => {
    it('construye el payload para refresh', () => {
      const payload = buildRefreshPayload({
        refreshToken: 'rt123',
        clientId: '123.apps.googleusercontent.com',
      })
      expect(payload.get('refresh_token')).toBe('rt123')
      expect(payload.get('client_id')).toBe('123.apps.googleusercontent.com')
      expect(payload.has('client_secret')).toBe(false)
      expect(payload.get('grant_type')).toBe('refresh_token')
    })
  })
})
