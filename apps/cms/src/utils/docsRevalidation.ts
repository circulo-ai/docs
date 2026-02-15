import type { PayloadRequest } from 'payload'

const REVALIDATE_SECRET_HEADER = 'x-revalidate-secret'

const normalizeServiceSlug = (value: unknown) => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().toLowerCase()
  return trimmed.length > 0 ? trimmed : undefined
}

const resolveRevalidateUrl = () => {
  const explicitUrl = process.env.DOCS_REVALIDATE_URL?.trim()
  if (explicitUrl) return explicitUrl

  const siteUrl = process.env.DOCS_SITE_URL?.trim()
  if (!siteUrl) return null

  try {
    return new URL('/api/revalidate/latest-version', siteUrl).toString()
  } catch {
    return null
  }
}

const resolveRevalidateSecret = () => {
  const value = process.env.DOCS_REVALIDATE_SECRET?.trim()
  return value && value.length > 0 ? value : null
}

type RevalidateOptions = {
  serviceSlug?: string | null
}

export const revalidateDocsLatestVersionCache = async (
  req: PayloadRequest,
  options: RevalidateOptions = {},
) => {
  const url = resolveRevalidateUrl()
  const secret = resolveRevalidateSecret()
  if (!url || !secret) return

  const service = normalizeServiceSlug(options.serviceSlug)
  const body = service ? { service } : {}

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [REVALIDATE_SECRET_HEADER]: secret,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const message = await response.text().catch(() => '')
      req.payload.logger.error({
        msg: `Docs latest-version revalidation failed (${response.status}): ${message || response.statusText}`,
      })
    }
  } catch (error) {
    req.payload.logger.error({
      msg: 'Docs latest-version revalidation request failed.',
      err: error,
    })
  }
}
