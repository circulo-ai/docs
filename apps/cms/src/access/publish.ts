import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  PayloadRequest,
} from 'payload'
import { ValidationError } from 'payload'

import { editorRoles, hasRole } from './roles'

export const enforcePublishPermissions =
  (label: string): CollectionBeforeChangeHook =>
  ({ collection, data, originalDoc, req }) => {
    const canPublish = hasRole(req.user, editorRoles)
    const nextStatus = data?.status ?? originalDoc?.status
    const wasPublished = originalDoc?.status === 'published'

    if (!canPublish) {
      if (nextStatus === 'published') {
        throw new ValidationError({
          collection: collection?.slug,
          errors: [
            {
              path: 'status',
              message: `${label} can only be published by editors or admins.`,
            },
          ],
          req,
        })
      }
      if (wasPublished) {
        throw new ValidationError({
          collection: collection?.slug,
          errors: [
            {
              path: 'status',
              message: `${label} is already published and can only be edited by editors or admins.`,
            },
          ],
          req,
        })
      }
    }

    return data
  }

const getRelationId = (value: unknown) => {
  if (!value) return null
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: string | number }).id
    if (id !== undefined) return id
  }
  return null
}

const sameId = (a: string | number | null, b: string | number | null) =>
  a !== null && b !== null && String(a) === String(b)

type VersionSnapshot = {
  id: string | number
  service?: unknown
  status?: 'draft' | 'published'
  defaultPageSlug?: string
}

type PageSnapshot = {
  id: string | number
  service?: unknown
  version?: unknown
  slug?: string
  status?: 'draft' | 'published'
}

const normalizeSlug = (value: unknown) => {
  if (typeof value !== 'string') return ''

  return value.trim().replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase()
}

const throwValidationError = (
  collectionSlug: string | undefined,
  req: PayloadRequest,
  path: string,
  message: string,
): never => {
  throw new ValidationError({
    collection: collectionSlug,
    errors: [
      {
        path,
        message,
      },
    ],
    req,
  })
}

const countDocPages = async (req: PayloadRequest, where: Record<string, unknown>) => {
  const result = await req.payload.find({
    collection: 'docPages',
    where: where as never,
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })

  return result.totalDocs
}

const findVersionByID = async (req: PayloadRequest, versionId: string | number) => {
  try {
    const versionDoc = await req.payload.findByID({
      collection: 'docVersions',
      id: versionId,
      req,
      overrideAccess: true,
      depth: 0,
    })

    return versionDoc as VersionSnapshot
  } catch {
    return null
  }
}

const findPageByID = async (req: PayloadRequest, pageId: string | number) => {
  try {
    const pageDoc = await req.payload.findByID({
      collection: 'docPages',
      id: pageId,
      req,
      overrideAccess: true,
      depth: 0,
    })

    return pageDoc as PageSnapshot
  } catch {
    return null
  }
}

type VersionStatus = 'draft' | 'published'

export const resolveVersionStatusFromPages = async (
  req: PayloadRequest,
  versionId: string | number,
): Promise<VersionStatus> => {
  const publishedPages = await countDocPages(req, {
    and: [{ version: { equals: versionId } }, { status: { equals: 'published' } }],
  })

  return publishedPages > 0 ? 'published' : 'draft'
}

export const setVersionStatusFromPages: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (operation === 'create') {
    return {
      ...(data ?? {}),
      status: 'draft',
    }
  }

  const versionId = getRelationId(originalDoc?.id)
  if (!versionId) {
    return {
      ...(data ?? {}),
      status: 'draft',
    }
  }

  const status = await resolveVersionStatusFromPages(req, versionId)

  return {
    ...(data ?? {}),
    status,
  }
}

export const syncVersionStatus = async (req: PayloadRequest, versionId: string | number) => {
  const versionDoc = await findVersionByID(req, versionId)
  if (!versionDoc) return

  const currentStatus = versionDoc.status === 'published' ? 'published' : 'draft'
  const status = await resolveVersionStatusFromPages(req, versionId)
  if (status === currentStatus) return

  await req.payload.update({
    collection: 'docVersions',
    id: versionId,
    data: {
      status,
    },
    req,
    overrideAccess: true,
    depth: 0,
  })
}

const toUniqueVersionIds = (...values: unknown[]) => {
  const ids = new Map<string, string | number>()

  for (const value of values) {
    const id = getRelationId(value)
    if (id === null) continue
    ids.set(String(id), id)
  }

  return Array.from(ids.values())
}

export const syncVersionStatusesForPageChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const versionIds = toUniqueVersionIds(doc?.version, previousDoc?.version)

  for (const versionId of versionIds) {
    await syncVersionStatus(req, versionId)
  }
}

export const syncVersionStatusForPageDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const versionId = getRelationId(doc?.version)
  if (!versionId) return

  await syncVersionStatus(req, versionId)
}

export const enforcePageServiceMatchesVersion: CollectionBeforeChangeHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  const collectionSlug = collection?.slug
  const serviceId = getRelationId(data?.service ?? originalDoc?.service)
  const versionId = getRelationId(data?.version ?? originalDoc?.version)

  if (!serviceId || !versionId) return data

  const versionDoc = await findVersionByID(req, versionId)
  if (!versionDoc) {
    throwValidationError(collectionSlug, req, 'version', 'Selected version could not be found.')
  }

  const versionServiceId = getRelationId(versionDoc?.service)
  if (!sameId(serviceId, versionServiceId)) {
    throwValidationError(
      collectionSlug,
      req,
      'service',
      'Doc page service must match the selected version service.',
    )
  }

  return data
}

export const enforcePublishedPageState: CollectionBeforeChangeHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  if (!originalDoc) return data

  const collectionSlug = collection?.slug
  const originalVersionId = getRelationId(originalDoc.version)
  const originalServiceId = getRelationId(originalDoc.service)
  const originalSlug = normalizeSlug(originalDoc.slug)

  if (!originalVersionId || !originalServiceId || !originalSlug) return data

  const versionDoc = await findVersionByID(req, originalVersionId)
  if (!versionDoc || versionDoc.status !== 'published') return data

  const nextVersionId = getRelationId(data?.version ?? originalDoc.version)
  const nextServiceId = getRelationId(data?.service ?? originalDoc.service)
  const nextSlug = normalizeSlug(data?.slug ?? originalDoc.slug)
  const defaultPageSlug = normalizeSlug(versionDoc.defaultPageSlug)

  const isDefaultPage = defaultPageSlug.length > 0 && defaultPageSlug === originalSlug
  if (isDefaultPage) {
    if (!sameId(nextVersionId, originalVersionId) || !sameId(nextServiceId, originalServiceId)) {
      throwValidationError(
        collectionSlug,
        req,
        'version',
        'This page is the default page of a published version and cannot be moved to another service/version.',
      )
    }

    if (nextSlug !== originalSlug) {
      throwValidationError(
        collectionSlug,
        req,
        'slug',
        'This page is the default page of a published version. Change the version default page slug first.',
      )
    }
  }

  return data
}

export const enforcePageDeleteIntegrity: CollectionBeforeDeleteHook = async ({
  collection,
  id,
  req,
}) => {
  const collectionSlug = collection?.slug
  const pageId = getRelationId(id)
  if (!pageId) return

  const pageDoc = await findPageByID(req, pageId)
  if (!pageDoc) return

  const versionId = getRelationId(pageDoc.version)
  const slug = normalizeSlug(pageDoc.slug)

  if (!pageId || !versionId || !slug) return

  const versionDoc = await findVersionByID(req, versionId)
  if (!versionDoc || versionDoc.status !== 'published') return

  const defaultPageSlug = normalizeSlug(versionDoc.defaultPageSlug)
  if (defaultPageSlug.length > 0 && defaultPageSlug === slug) {
    throwValidationError(
      collectionSlug,
      req,
      'slug',
      'Cannot delete the default page of a published version. Change defaultPageSlug first.',
    )
  }
}
