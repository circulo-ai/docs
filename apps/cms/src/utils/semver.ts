export type ParsedSemver = {
  major: number
  minor: number
  patch: number
  prerelease: string | null
}

const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

const padNumber = (value: number, width = 6) => value.toString().padStart(width, '0')

const normalizePrerelease = (value: string | null) => {
  if (!value) return '1'

  const parts = value.split('.').map((part) => {
    if (/^\d+$/.test(part)) {
      return `n${part.padStart(6, '0')}`
    }
    return `s${part.toLowerCase()}`
  })

  return `0.${parts.join('.')}`
}

export const parseSemver = (input: string): ParsedSemver => {
  const trimmed = input.trim()
  if (trimmed.startsWith('v')) {
    throw new Error('Version must not include a leading "v".')
  }

  const match = trimmed.match(SEMVER_REGEX)
  if (!match) {
    throw new Error('Version must follow semver (e.g. "1.2.3" or "1.2.3-alpha.1").')
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  }
}

export const buildVersionKey = (parsed: ParsedSemver) => {
  const base = `${padNumber(parsed.major)}.${padNumber(parsed.minor)}.${padNumber(parsed.patch)}`
  return `${base}.${normalizePrerelease(parsed.prerelease)}`
}
