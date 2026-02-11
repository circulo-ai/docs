type ValidationResult = true | string

const DOC_PATH_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/
const SERVICE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const toTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const hasWhitespace = (value: string) => /\s/.test(value)

const normalizeRedirectPath = (value: string) => {
  if (value.length > 1 && value.endsWith('/')) {
    return value.replace(/\/+$/, '')
  }

  return value
}

const normalizeDestinationForCompare = (value: string) => {
  if (value.startsWith('/')) return normalizeRedirectPath(value)

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return value

    const normalizedPathname =
      url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname

    return `${url.origin}${normalizedPathname}${url.search}${url.hash}`
  } catch {
    return value
  }
}

const isHttpsUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.length > 0
  } catch {
    return false
  }
}

export const validateTrimmedRequired = (value: unknown, label: string): ValidationResult =>
  isNonEmptyString(value) ? true : `${label} is required.`

export const validateOptionalTrimmedString = (value: unknown, label: string): ValidationResult => {
  if (value === null || value === undefined || value === '') return true

  if (typeof value !== 'string' || value.trim().length === 0) {
    return `${label} must be a non-empty string.`
  }

  return true
}

export const validateDocPathSlug = (value: unknown, label: string): ValidationResult => {
  if (!isNonEmptyString(value)) {
    return `${label} is required.`
  }

  const trimmed = value.trim()

  if (trimmed.startsWith('/')) {
    return `${label} must not start with "/".`
  }

  if (hasWhitespace(trimmed)) {
    return `${label} must not include spaces.`
  }

  if (trimmed.includes('..')) {
    return `${label} must not include "..".`
  }

  if (!DOC_PATH_SLUG_REGEX.test(trimmed)) {
    return `${label} must be lowercase kebab-case segments separated by "/".`
  }

  return true
}

export const validateServiceSlug = (value: unknown): ValidationResult => {
  if (!isNonEmptyString(value)) {
    return 'Service slug is required.'
  }

  const trimmed = value.trim()

  if (trimmed.includes('/')) {
    return 'Service slug must not include "/".'
  }

  if (hasWhitespace(trimmed)) {
    return 'Service slug must not include spaces.'
  }

  if (trimmed.includes('..')) {
    return 'Service slug must not include "..".'
  }

  if (!SERVICE_SLUG_REGEX.test(trimmed)) {
    return 'Service slug must be lowercase kebab-case.'
  }

  return true
}

export const validateRedirectFrom = (value: unknown): ValidationResult => {
  if (!isNonEmptyString(value)) {
    return 'Redirect "from" is required.'
  }

  const trimmed = value.trim()

  if (!trimmed.startsWith('/')) {
    return 'Redirect "from" must start with "/".'
  }

  if (trimmed.startsWith('//')) {
    return 'Redirect "from" must start with a single "/".'
  }

  if (hasWhitespace(trimmed)) {
    return 'Redirect "from" must not include spaces.'
  }

  if (trimmed.includes('..')) {
    return 'Redirect "from" must not include "..".'
  }

  return true
}

type RedirectToValidationOptions = {
  from?: unknown
}

export const validateRedirectTo = (
  value: unknown,
  options?: RedirectToValidationOptions,
): ValidationResult => {
  if (!isNonEmptyString(value)) {
    return 'Redirect "to" is required.'
  }

  const trimmed = value.trim()

  if (hasWhitespace(trimmed)) {
    return 'Redirect "to" must not include spaces.'
  }

  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//')) {
      return 'Redirect "to" path must start with a single "/".'
    }

    if (trimmed.includes('..')) {
      return 'Redirect "to" path must not include "..".'
    }
  } else if (!isHttpsUrl(trimmed)) {
    return 'Redirect "to" must be an internal path ("/...") or an absolute "https://" URL.'
  }

  const fromValue = toTrimmedString(options?.from)
  if (!fromValue) return true

  if (normalizeDestinationForCompare(trimmed) === normalizeDestinationForCompare(fromValue)) {
    return 'Redirect "to" must be different from "from".'
  }

  return true
}
