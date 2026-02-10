import type {
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

const countPublishedPagesForVersion = async (
  req: PayloadRequest,
  params: {
    versionId: string | number
    serviceId: string | number
    excludePageId?: string | number | null
  },
) => {
  const conditions: Record<string, unknown>[] = [
    { version: { equals: params.versionId } },
    { service: { equals: params.serviceId } },
    { status: { equals: 'published' } },
  ]

  if (params.excludePageId !== undefined && params.excludePageId !== null) {
    conditions.push({ id: { not_equals: params.excludePageId } })
  }

  return countDocPages(req, { and: conditions })
}

export const enforceVersionStateIntegrity: CollectionBeforeChangeHook = async ({
  collection,
  data,
  originalDoc,
  req,
  operation,
}) => {
  const nextStatus = data?.status ?? originalDoc?.status
  if (nextStatus !== 'published' && nextStatus !== 'draft') return data

  const collectionSlug = collection?.slug
  const versionId = getRelationId(originalDoc?.id)
  const serviceId = getRelationId(data?.service ?? originalDoc?.service)
  const defaultPageSlug = normalizeSlug(data?.defaultPageSlug ?? originalDoc?.defaultPageSlug)

  if (nextStatus === 'published') {
    if (operation === 'create' || !versionId) {
      throwValidationError(
        collectionSlug,
        req,
        'status',
        'Create this version as draft first, then add and publish pages before publishing the version.',
      )
    }

    if (!serviceId) {
      throwValidationError(
        collectionSlug,
        req,
        'service',
        'A service is required before publishing.',
      )
    }

    const totalPages = await countDocPages(req, {
      version: { equals: versionId },
    })

    if (totalPages === 0) {
      throwValidationError(
        collectionSlug,
        req,
        'status',
        'Doc version cannot be published without pages. Add at least one page first.',
      )
    }

    const mismatchedServicePages = await countDocPages(req, {
      and: [{ version: { equals: versionId } }, { service: { not_equals: serviceId } }],
    })

    if (mismatchedServicePages > 0) {
      throwValidationError(
        collectionSlug,
        req,
        'service',
        'Some pages in this version belong to another service. Fix page service/version links before publishing.',
      )
    }

    const publishedPages = await countPublishedPagesForVersion(req, {
      versionId: versionId as string | number,
      serviceId: serviceId as string | number,
    })

    if (publishedPages === 0) {
      throwValidationError(
        collectionSlug,
        req,
        'status',
        'Doc version cannot be published without at least one published page.',
      )
    }

    if (!defaultPageSlug) {
      throwValidationError(
        collectionSlug,
        req,
        'defaultPageSlug',
        'Default page slug is required and must point to a published page before publishing this version.',
      )
    }

    const defaultPublishedPageCount = await countDocPages(req, {
      and: [
        { version: { equals: versionId } },
        { service: { equals: serviceId } },
        { slug: { equals: defaultPageSlug } },
        { status: { equals: 'published' } },
      ],
    })

    if (defaultPublishedPageCount === 0) {
      const defaultPageExists = await countDocPages(req, {
        and: [
          { version: { equals: versionId } },
          { service: { equals: serviceId } },
          { slug: { equals: defaultPageSlug } },
        ],
      })

      if (defaultPageExists > 0) {
        throwValidationError(
          collectionSlug,
          req,
          'defaultPageSlug',
          'Default page exists but is not published. Publish that page or choose another published default page slug.',
        )
      }

      throwValidationError(
        collectionSlug,
        req,
        'defaultPageSlug',
        'Default page slug must match an existing published page in this version.',
      )
    }
  }

  if (nextStatus === 'draft' && originalDoc?.status === 'published' && versionId) {
    const publishedPages = await countDocPages(req, {
      and: [{ version: { equals: versionId } }, { status: { equals: 'published' } }],
    })

    if (publishedPages > 0) {
      throwValidationError(
        collectionSlug,
        req,
        'status',
        'Doc version cannot be set to draft while it still has published pages. Unpublish those pages first.',
      )
    }
  }

  return data
}

export const enforceVersionPublished: CollectionBeforeChangeHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  const nextStatus = data?.status ?? originalDoc?.status
  if (nextStatus !== 'published') return data

  const versionValue = data?.version ?? originalDoc?.version
  const versionId = getRelationId(versionValue)
  if (!versionId) {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [
        {
          path: 'version',
          message: 'Doc page requires a published version before it can be published.',
        },
      ],
      req,
    })
  }

  let versionDoc
  try {
    versionDoc = await req.payload.findByID({
      collection: 'docVersions',
      id: versionId,
      req,
      overrideAccess: false,
    })
  } catch (error) {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [
        {
          path: 'version',
          message: 'Selected version could not be found.',
        },
      ],
      req,
    })
  }

  if (versionDoc?.status !== 'published') {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [
        {
          path: 'status',
          message:
            'Doc page cannot be published while its version is in draft. Publish the version first.',
        },
      ],
      req,
    })
  }

  return data
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
  const originalPageId = getRelationId(originalDoc.id)
  const originalVersionId = getRelationId(originalDoc.version)
  const originalServiceId = getRelationId(originalDoc.service)
  const originalSlug = normalizeSlug(originalDoc.slug)

  if (!originalPageId || !originalVersionId || !originalServiceId || !originalSlug) return data

  const versionDoc = await findVersionByID(req, originalVersionId)
  if (!versionDoc || versionDoc.status !== 'published') return data

  const nextStatus = data?.status ?? originalDoc.status
  const nextVersionId = getRelationId(data?.version ?? originalDoc.version)
  const nextServiceId = getRelationId(data?.service ?? originalDoc.service)
  const nextSlug = normalizeSlug(data?.slug ?? originalDoc.slug)
  const defaultPageSlug = normalizeSlug(versionDoc.defaultPageSlug)

  const isDefaultPage = defaultPageSlug.length > 0 && defaultPageSlug === originalSlug
  if (isDefaultPage) {
    if (nextStatus !== 'published') {
      throwValidationError(
        collectionSlug,
        req,
        'status',
        'This page is the default page of a published version and cannot be set to draft.',
      )
    }

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

  const leavesPublishedSet =
    originalDoc.status === 'published' &&
    (nextStatus !== 'published' ||
      !sameId(nextVersionId, originalVersionId) ||
      !sameId(nextServiceId, originalServiceId))

  if (leavesPublishedSet) {
    const remainingPublishedPages = await countPublishedPagesForVersion(req, {
      versionId: originalVersionId,
      serviceId: originalServiceId,
      excludePageId: originalPageId,
    })

    if (remainingPublishedPages === 0) {
      throwValidationError(
        collectionSlug,
        req,
        'status',
        'This is the last published page for a published version. Publish another page before changing this one.',
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
  const serviceId = getRelationId(pageDoc.service)
  const slug = normalizeSlug(pageDoc.slug)

  if (!pageId || !versionId || !serviceId || !slug) return

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

  if (pageDoc.status === 'published') {
    const remainingPublishedPages = await countPublishedPagesForVersion(req, {
      versionId,
      serviceId,
      excludePageId: pageId,
    })

    if (remainingPublishedPages === 0) {
      throwValidationError(
        collectionSlug,
        req,
        'id',
        'Cannot delete the last published page of a published version.',
      )
    }
  }
}
