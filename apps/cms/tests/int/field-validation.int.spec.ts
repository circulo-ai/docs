import { describe, expect, it } from 'vitest'

import {
  validateDocPathSlug,
  validateOptionalTrimmedString,
  validateRedirectFrom,
  validateRedirectTo,
  validateServiceSlug,
  validateTrimmedRequired,
} from '../../src/utils/fieldValidation'

describe('field validation helpers', () => {
  describe('validateTrimmedRequired', () => {
    it('accepts non-empty trimmed text', () => {
      expect(validateTrimmedRequired('API docs', 'Title')).toBe(true)
    })

    it('rejects blank text', () => {
      expect(validateTrimmedRequired('   ', 'Title')).toBe('Title is required.')
    })
  })

  describe('validateOptionalTrimmedString', () => {
    it('allows empty optional values', () => {
      expect(validateOptionalTrimmedString('', 'Description')).toBe(true)
      expect(validateOptionalTrimmedString(undefined, 'Description')).toBe(true)
    })

    it('rejects whitespace-only values', () => {
      expect(validateOptionalTrimmedString('   ', 'Description')).toBe(
        'Description must be a non-empty string.',
      )
    })
  })

  describe('validateDocPathSlug', () => {
    it('accepts lowercase kebab-case segments', () => {
      expect(validateDocPathSlug('getting-started', 'Doc page slug')).toBe(true)
      expect(validateDocPathSlug('api/auth-flows', 'Doc page slug')).toBe(true)
    })

    it('rejects leading slash', () => {
      expect(validateDocPathSlug('/getting-started', 'Doc page slug')).toBe(
        'Doc page slug must not start with "/".',
      )
    })

    it('rejects spaces and path traversal', () => {
      expect(validateDocPathSlug('getting started', 'Doc page slug')).toBe(
        'Doc page slug must not include spaces.',
      )
      expect(validateDocPathSlug('api/../secrets', 'Doc page slug')).toBe(
        'Doc page slug must not include "..".',
      )
    })

    it('rejects uppercase and invalid separators', () => {
      expect(validateDocPathSlug('Getting-Started', 'Doc page slug')).toBe(
        'Doc page slug must be lowercase kebab-case segments separated by "/".',
      )
      expect(validateDocPathSlug('getting_started', 'Doc page slug')).toBe(
        'Doc page slug must be lowercase kebab-case segments separated by "/".',
      )
    })
  })

  describe('validateServiceSlug', () => {
    it('accepts lowercase kebab-case single segment', () => {
      expect(validateServiceSlug('api')).toBe(true)
      expect(validateServiceSlug('command-line')).toBe(true)
    })

    it('rejects nested path style values', () => {
      expect(validateServiceSlug('api/v1')).toBe('Service slug must not include "/".')
      expect(validateServiceSlug('/api')).toBe('Service slug must not include "/".')
    })
  })

  describe('validateRedirectFrom', () => {
    it('accepts internal path starting with slash', () => {
      expect(validateRedirectFrom('/guides/old')).toBe(true)
    })

    it('rejects missing slash', () => {
      expect(validateRedirectFrom('guides/old')).toBe('Redirect "from" must start with "/".')
    })

    it('rejects spaces and path traversal', () => {
      expect(validateRedirectFrom('/guides/old page')).toBe(
        'Redirect "from" must not include spaces.',
      )
      expect(validateRedirectFrom('/guides/../secret')).toBe(
        'Redirect "from" must not include "..".',
      )
    })
  })

  describe('validateRedirectTo', () => {
    it('accepts an internal path destination', () => {
      expect(validateRedirectTo('/guides/new')).toBe(true)
    })

    it('accepts an https destination URL', () => {
      expect(validateRedirectTo('https://example.com/docs/new')).toBe(true)
    })

    it('rejects http and non-path relative destinations', () => {
      expect(validateRedirectTo('http://example.com/docs/new')).toBe(
        'Redirect "to" must be an internal path ("/...") or an absolute "https://" URL.',
      )
      expect(validateRedirectTo('guides/new')).toBe(
        'Redirect "to" must be an internal path ("/...") or an absolute "https://" URL.',
      )
    })

    it('rejects spaces, path traversal, and no-op destinations', () => {
      expect(validateRedirectTo('/guides/new page')).toBe(
        'Redirect "to" must not include spaces.',
      )
      expect(validateRedirectTo('/guides/../secret')).toBe(
        'Redirect "to" path must not include "..".',
      )
      expect(validateRedirectTo('/guides/old', { from: '/guides/old' })).toBe(
        'Redirect "to" must be different from "from".',
      )
    })
  })
})
