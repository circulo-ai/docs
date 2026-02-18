import {
  SERVICE_THEME_DARK_TOKENS,
  SERVICE_THEME_LIGHT_TOKENS,
  serviceThemeTokenToFieldName,
  type ServiceThemeToken,
} from './serviceThemeTokens'

type DarkServiceThemeToken = Exclude<ServiceThemeToken, 'radius'>

export type ParsedServiceThemeCssTokens = {
  light: Partial<Record<ServiceThemeToken, string>>
  dark: Partial<Record<DarkServiceThemeToken, string>>
}

export type ServiceThemeFieldUpdate = {
  mode: 'light' | 'dark'
  token: string
  path: string
  value: string
}

const LIGHT_TOKEN_SET = new Set<ServiceThemeToken>(SERVICE_THEME_LIGHT_TOKENS)
const DARK_TOKEN_SET = new Set<DarkServiceThemeToken>(SERVICE_THEME_DARK_TOKENS)

const ROOT_BLOCK_PATTERN = /:root\s*\{([\s\S]*?)\}/i
const DARK_BLOCK_PATTERN = /\.dark\b\s*\{([\s\S]*?)\}/i

const normalizeCssSource = (value: string) =>
  value.replace(/^\s*```(?:css)?\s*/i, '').replace(/\s*```\s*$/i, '')

const getBlockBody = (source: string, pattern: RegExp) => {
  const match = pattern.exec(source)
  return match?.[1] ?? ''
}

const isLightToken = (token: string): token is ServiceThemeToken =>
  LIGHT_TOKEN_SET.has(token as ServiceThemeToken)

const isDarkToken = (token: string): token is DarkServiceThemeToken =>
  DARK_TOKEN_SET.has(token as DarkServiceThemeToken)

const parseTokenBlock = <TToken extends string>(
  block: string,
  isAllowedToken: (token: string) => token is TToken,
): Partial<Record<TToken, string>> => {
  const values: Partial<Record<TToken, string>> = {}

  for (const match of block.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+)\s*;/gi)) {
    const token = (match[1] ?? '').toLowerCase()
    const value = (match[2] ?? '').trim()

    if (!token || !value || !isAllowedToken(token)) {
      continue
    }

    values[token] = value
  }

  return values
}

export const parseServiceThemeCssTokens = (value: string): ParsedServiceThemeCssTokens => {
  const source = normalizeCssSource(value)

  return {
    light: parseTokenBlock(getBlockBody(source, ROOT_BLOCK_PATTERN), isLightToken),
    dark: parseTokenBlock(getBlockBody(source, DARK_BLOCK_PATTERN), isDarkToken),
  }
}

export const toServiceThemeFieldUpdates = (
  parsed: ParsedServiceThemeCssTokens,
): ServiceThemeFieldUpdate[] => {
  const updates: ServiceThemeFieldUpdate[] = []

  for (const token of SERVICE_THEME_LIGHT_TOKENS) {
    const nextValue = parsed.light[token]?.trim()
    if (!nextValue) continue

    updates.push({
      mode: 'light',
      token,
      path: `light.${serviceThemeTokenToFieldName(token)}`,
      value: nextValue,
    })
  }

  for (const token of SERVICE_THEME_DARK_TOKENS) {
    const nextValue = parsed.dark[token]?.trim()
    if (!nextValue) continue

    updates.push({
      mode: 'dark',
      token,
      path: `dark.${serviceThemeTokenToFieldName(token)}`,
      value: nextValue,
    })
  }

  return updates
}
