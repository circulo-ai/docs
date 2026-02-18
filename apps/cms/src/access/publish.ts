import type {
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  PayloadRequest,
} from 'payload'
import { ValidationError } from 'payload'

import {
  collectDocVersionNavPageIds,
  dedupePublishedDocVersionNavSlugs,
  flattenDocVersionNavRows,
  getRelationId,
  hasPublishedDocVersionNavRows,
  normalizeDocVersionNavItems,
  promoteAndPruneGroupFromDocVersionNavItems,
  prunePageFromDocVersionNavItems,
  sameId,
} from '../utils/versionNav'
import { editorRoles, hasRole } from './roles'

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

const countPublishedRowsByPageId = (navItems: unknown) => {
  const counts = new Map<string, number>()

  flattenDocVersionNavRows(normalizeDocVersionNavItems(navItems))
    .filter((row) => row.published)
    .forEach((row) => {
      const key = String(row.pageId)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })

  return counts
}

const hasPublishedEscalation = (beforeNavItems: unknown, afterNavItems: unknown) => {
  const beforeCounts = countPublishedRowsByPageId(beforeNavItems)
  const afterCounts = countPublishedRowsByPageId(afterNavItems)

  for (const [pageId, afterCount] of afterCounts.entries()) {
    const beforeCount = beforeCounts.get(pageId) ?? 0
    if (afterCount > beforeCount) return true
  }

  return false
}

export const enforcePublishPermissions =
  (label: string): CollectionBeforeChangeHook =>
  ({ collection, data, originalDoc, req }) => {
    const canPublish = hasRole(req.user, editorRoles)
    const nextStatus = data?.status ?? originalDoc?.status
    const nextNavItems = data?.navItems ?? originalDoc?.navItems
    const previousNavItems = originalDoc?.navItems ?? []

    if (!canPublish) {
      if (hasPublishedEscalation(previousNavItems, nextNavItems)) {
        throwValidationError(
          collection?.slug,
          req,
          'navItems',
          `${label} can only publish nav rows when edited by an editor or admin.`,
        )
      }

      if (nextStatus === 'published' && !originalDoc) {
        throwValidationError(
          collection?.slug,
          req,
          'status',
          `${label} can only be published by editors or admins.`,
        )
      }
    }

    return data
  }

type VersionStatus = 'draft' | 'published'

export const resolveVersionStatusFromNavItems = (navItems: unknown): VersionStatus => {
  const normalized = normalizeDocVersionNavItems(navItems)
  return hasPublishedDocVersionNavRows(normalized) ? 'published' : 'draft'
}

type VersionSnapshot = {
  id: number | string
  service?: unknown
  status?: 'draft' | 'published'
  defaultPageSlug?: string
  navItems?: unknown
}

type PageSnapshot = {
  id: number | string
  service?: unknown
  slug?: string
}

const findVersionsByService = async (req: PayloadRequest, serviceId: number | string) => {
  const versions: VersionSnapshot[] = []
  let page = 1

  while (true) {
    const result = await req.payload.find({
      collection: 'docVersions',
      where: {
        service: {
          equals: serviceId,
        },
      },
      page,
      limit: 100,
      depth: 0,
      req,
      overrideAccess: true,
    })

    versions.push(...(result.docs as unknown as VersionSnapshot[]))
    if (!result.hasNextPage || !result.nextPage) break
    page = result.nextPage
  }

  return versions
}

const findPagesByIds = async (
  req: PayloadRequest,
  pageIds: Array<number | string>,
): Promise<PageSnapshot[]> => {
  if (pageIds.length === 0) return []

  const result = await req.payload.find({
    collection: 'docPages',
    where: {
      id: {
        in: pageIds as never[],
      },
    },
    limit: pageIds.length,
    depth: 0,
    req,
    overrideAccess: true,
  })

  return result.docs as unknown as PageSnapshot[]
}

const buildPageSlugMap = async (req: PayloadRequest, navItems: unknown) => {
  const pageIds = collectDocVersionNavPageIds(normalizeDocVersionNavItems(navItems))
  const pages = await findPagesByIds(req, pageIds)
  const map = new Map<string, string>()

  pages.forEach((page) => {
    map.set(String(page.id), normalizeSlug(page.slug))
  })

  return map
}

const versionContainsPage = (version: VersionSnapshot, pageId: number | string) => {
  const target = String(pageId)
  const rows = flattenDocVersionNavRows(normalizeDocVersionNavItems(version.navItems))
  return rows.some((row) => String(row.pageId) === target)
}

const versionContainsPublishedPage = (version: VersionSnapshot, pageId: number | string) => {
  const target = String(pageId)
  const rows = flattenDocVersionNavRows(normalizeDocVersionNavItems(version.navItems))
  return rows.some((row) => row.published && String(row.pageId) === target)
}

export const enforcePageUpdateIntegrity: CollectionBeforeChangeHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  if (!originalDoc) return data

  const pageId = getRelationId(originalDoc.id)
  const originalServiceId = getRelationId(originalDoc.service)
  if (!pageId || !originalServiceId) return data

  const nextServiceId = getRelationId(data?.service ?? originalDoc.service)
  const originalSlug = normalizeSlug(originalDoc.slug)
  const nextSlug = normalizeSlug(data?.slug ?? originalDoc.slug)

  const versions = await findVersionsByService(req, originalServiceId)

  if (!sameId(nextServiceId, originalServiceId)) {
    const linked = versions.some((version) => versionContainsPage(version, pageId))
    if (linked) {
      throwValidationError(
        collection?.slug,
        req,
        'service',
        'This page is linked in doc version navigation and cannot be moved to another service.',
      )
    }
  }

  if (nextSlug === originalSlug || !originalSlug) return data

  for (const version of versions) {
    if (version.status !== 'published') continue
    if (!versionContainsPublishedPage(version, pageId)) continue

    const defaultSlug = normalizeSlug(version.defaultPageSlug)
    if (defaultSlug && defaultSlug === originalSlug) {
      throwValidationError(
        collection?.slug,
        req,
        'slug',
        'This page is the default page of a published version. Change defaultPageSlug first.',
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
  const pageId = getRelationId(id)
  if (!pageId) return

  let pageDoc: PageSnapshot | null = null
  try {
    pageDoc = (await req.payload.findByID({
      collection: 'docPages',
      id: pageId,
      req,
      depth: 0,
      overrideAccess: true,
    })) as unknown as PageSnapshot
  } catch {
    pageDoc = null
  }

  if (!pageDoc) return

  const serviceId = getRelationId(pageDoc.service)
  if (!serviceId) return

  const pageSlug = normalizeSlug(pageDoc.slug)
  if (!pageSlug) return

  const versions = await findVersionsByService(req, serviceId)
  for (const version of versions) {
    if (version.status !== 'published') continue
    if (!versionContainsPublishedPage(version, pageId)) continue

    const defaultSlug = normalizeSlug(version.defaultPageSlug)
    if (defaultSlug && defaultSlug === pageSlug) {
      throwValidationError(
        collection?.slug,
        req,
        'slug',
        'Cannot delete the default page of a published version. Change defaultPageSlug first.',
      )
    }
  }
}

const syncVersionStatusFromNavItems = async (req: PayloadRequest, version: VersionSnapshot) => {
  const navItems = normalizeDocVersionNavItems(version.navItems)
  const nextStatus = hasPublishedDocVersionNavRows(navItems) ? 'published' : 'draft'
  const currentStatus = version.status === 'published' ? 'published' : 'draft'
  if (nextStatus === currentStatus) return

  await req.payload.update({
    collection: 'docVersions',
    id: version.id,
    data: {
      status: nextStatus,
    },
    req,
    depth: 0,
    overrideAccess: true,
  })
}

export const pruneDeletedPageFromVersions: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const pageId = getRelationId(doc?.id)
  const serviceId = getRelationId((doc as { service?: unknown } | null | undefined)?.service)
  if (!pageId || !serviceId) return

  const versions = await findVersionsByService(req, serviceId)
  for (const version of versions) {
    const normalized = normalizeDocVersionNavItems(version.navItems)
    const pruned = prunePageFromDocVersionNavItems(normalized, pageId)
    if (JSON.stringify(pruned) === JSON.stringify(normalized)) continue

    await req.payload.update({
      collection: 'docVersions',
      id: version.id,
      data: {
        navItems: pruned,
        navWarnings: null,
        status: resolveVersionStatusFromNavItems(pruned),
      } as never,
      req,
      depth: 0,
      overrideAccess: true,
    } as never)
  }
}

export const pruneDeletedGroupFromVersions: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const groupId = getRelationId(doc?.id)
  const serviceId = getRelationId((doc as { service?: unknown } | null | undefined)?.service)
  if (!groupId || !serviceId) return

  const versions = await findVersionsByService(req, serviceId)
  for (const version of versions) {
    const normalized = normalizeDocVersionNavItems(version.navItems)
    const nextItems = promoteAndPruneGroupFromDocVersionNavItems(normalized, groupId)
    if (JSON.stringify(nextItems) === JSON.stringify(normalized)) continue

    const pageSlugById = await buildPageSlugMap(req, nextItems)
    const deduped = dedupeRows(nextItems, pageSlugById)

    await req.payload.update({
      collection: 'docVersions',
      id: version.id,
      data: {
        navItems: deduped.items,
        navWarnings: deduped.warnings.length > 0 ? deduped.warnings.join('\n') : null,
        status: resolveVersionStatusFromNavItems(deduped.items),
      } as never,
      req,
      depth: 0,
      overrideAccess: true,
    } as never)
  }
}

const dedupeRows = (
  navItems: unknown,
  pageSlugById: Map<string, string>,
): { items: ReturnType<typeof normalizeDocVersionNavItems>; warnings: string[] } => {
  const deduped = dedupePublishedDocVersionNavSlugs(
    normalizeDocVersionNavItems(navItems),
    pageSlugById,
  )

  return {
    items: deduped.items,
    warnings: deduped.warnings,
  }
}

// Keep exported for tests and hook composition.
export const syncVersionStatus = async (req: PayloadRequest, versionId: number | string) => {
  try {
    const version = (await req.payload.findByID({
      collection: 'docVersions',
      id: versionId,
      req,
      depth: 0,
      overrideAccess: true,
    })) as unknown as VersionSnapshot

    await syncVersionStatusFromNavItems(req, version)
  } catch {
    // no-op when version does not exist
  }
}
