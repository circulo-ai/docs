import type {
  CollectionAfterChangeHook,
  CollectionAfterReadHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  PayloadRequest,
} from 'payload'
import { ValidationError } from 'payload'

import { isWriter, readPublishedOrRoles, writerRoles, isEditor } from '../access/roles'
import { enforcePublishPermissions } from '../access/publish'
import { validateDocPathSlug } from '../utils/fieldValidation'
import { extractServiceId, syncLatestVersionForServices } from '../utils/latestVersion'
import { buildVersionKey, parseSemver } from '../utils/semver'
import {
  collectDocVersionNavPageIds,
  collectDocVersionNavGroupIds,
  dedupePublishedDocVersionNavSlugs,
  flattenDocVersionNavRows,
  getRelationId,
  hasPublishedDocVersionNavRows,
  normalizeDocVersionNavItems,
  sameId,
} from '../utils/versionNav'

type RelationValue = number | string | { id?: number | string; name?: unknown } | null | undefined

const getRelationName = (value: RelationValue) => {
  if (!value || typeof value !== 'object') return null
  if (typeof value.name !== 'string') return null
  const trimmed = value.name.trim()
  return trimmed.length > 0 ? trimmed : null
}

const readServiceFromContainer = (value: unknown) => {
  if (!value || typeof value !== 'object') return undefined
  return (value as { service?: unknown }).service
}

const getNavFilterServiceId = (args: { data?: unknown; siblingData?: unknown }) =>
  getRelationId(readServiceFromContainer(args.data) ?? readServiceFromContainer(args.siblingData))

const filterNavItemsByService = ({
  data,
  siblingData,
}: {
  data?: unknown
  siblingData?: unknown
}) => {
  const serviceId = getNavFilterServiceId({ data, siblingData })
  if (!serviceId) return false

  return {
    service: {
      equals: serviceId,
    },
  }
}

const formatAdminLabel = (version: string, serviceName: string | null) =>
  serviceName ? `${version} (${serviceName})` : version

const resolveServiceName = async (req: PayloadRequest, service: RelationValue) => {
  const existingName = getRelationName(service)
  if (existingName) return existingName

  const serviceId = getRelationId(service)
  if (!serviceId) return null

  try {
    const serviceDoc = await req.payload.findByID({
      collection: 'services',
      id: serviceId,
      req,
      overrideAccess: false,
      depth: 0,
    })

    return getRelationName(serviceDoc as RelationValue)
  } catch {
    return null
  }
}

const syncSemverFields: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const version = data?.version ?? originalDoc?.version
  if (!version) return data

  const parsed = parseSemver(version)
  return {
    ...(data ?? {}),
    versionKey: buildVersionKey(parsed),
    isPrerelease: parsed.prerelease !== null,
  }
}

const normalizeDefaultPageSlug = (value: string) =>
  value
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/\/+/g, '/')

const normalizeDefaultPageSlugHook: CollectionBeforeValidateHook = ({ data }) => {
  if (!data?.defaultPageSlug) return data

  return {
    ...data,
    defaultPageSlug: normalizeDefaultPageSlug(data.defaultPageSlug),
  }
}

const normalizeDocPageSlug = (value: unknown) => {
  if (typeof value !== 'string') return ''

  return value.trim().replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase()
}

const throwValidationError = (
  collectionSlug: string | undefined,
  req: PayloadRequest,
  errors: Array<{ path: string; message: string }>,
): never => {
  throw new ValidationError({
    collection: collectionSlug,
    errors,
    req,
  })
}

const findManyByIds = async (
  req: PayloadRequest,
  collection: 'docPages' | 'docPageGroups',
  ids: Array<number | string>,
) => {
  if (ids.length === 0) return []

  const result = await req.payload.find({
    collection,
    where: {
      id: {
        in: ids as never[],
      },
    },
    limit: ids.length,
    depth: 0,
    req,
    overrideAccess: false,
  })

  return result.docs
}

export const enforceNavItemsIntegrity: CollectionBeforeValidateHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  const serviceId = getRelationId(data?.service ?? originalDoc?.service)
  const navItems = normalizeDocVersionNavItems(data?.navItems ?? originalDoc?.navItems)

  const pageIds = collectDocVersionNavPageIds(navItems)
  const groupIds = collectDocVersionNavGroupIds(navItems)

  const [pageDocs, groupDocs] = await Promise.all([
    findManyByIds(req, 'docPages', pageIds),
    findManyByIds(req, 'docPageGroups', groupIds),
  ])

  const pageById = new Map<string, Record<string, unknown>>()
  pageDocs.forEach((doc) => pageById.set(String(doc.id), doc as unknown as Record<string, unknown>))

  const groupById = new Map<string, Record<string, unknown>>()
  groupDocs.forEach((doc) =>
    groupById.set(String(doc.id), doc as unknown as Record<string, unknown>),
  )

  const errors: Array<{ path: string; message: string }> = []

  pageIds.forEach((pageId) => {
    const pageDoc = pageById.get(String(pageId))
    if (!pageDoc) {
      errors.push({
        path: 'navItems',
        message: `Selected doc page ${String(pageId)} could not be found.`,
      })
      return
    }

    if (!serviceId) return

    const pageServiceId = getRelationId(pageDoc.service)
    if (!sameId(pageServiceId, serviceId)) {
      errors.push({
        path: 'navItems',
        message: `Doc page ${String(pageId)} must belong to the same service as this version.`,
      })
    }
  })

  groupIds.forEach((groupId) => {
    const groupDoc = groupById.get(String(groupId))
    if (!groupDoc) {
      errors.push({
        path: 'navItems',
        message: `Selected doc page group ${String(groupId)} could not be found.`,
      })
      return
    }

    if (!serviceId) return

    const groupServiceId = getRelationId(groupDoc.service)
    if (!sameId(groupServiceId, serviceId)) {
      errors.push({
        path: 'navItems',
        message: `Doc page group ${String(groupId)} must belong to the same service as this version.`,
      })
    }
  })

  if (errors.length > 0) {
    throwValidationError(collection?.slug, req, errors)
  }

  const pageSlugById = new Map<string, string>()
  pageById.forEach((pageDoc, pageId) => {
    pageSlugById.set(pageId, normalizeDocPageSlug(pageDoc.slug))
  })

  const deduped = dedupePublishedDocVersionNavSlugs(navItems, pageSlugById)
  const navWarnings = deduped.warnings.length > 0 ? deduped.warnings.join('\n') : null

  return {
    ...(data ?? {}),
    navItems: deduped.items,
    navWarnings,
  }
}

export const setVersionStatusFromNavItems: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const navItems = normalizeDocVersionNavItems(data?.navItems ?? originalDoc?.navItems)
  const status = hasPublishedDocVersionNavRows(navItems) ? 'published' : 'draft'

  return {
    ...(data ?? {}),
    status,
  }
}

export const enforceDefaultPageSlugMatchesPublishedNav: CollectionBeforeChangeHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  const nextStatus = (data?.status ?? originalDoc?.status) === 'published' ? 'published' : 'draft'
  if (nextStatus !== 'published') return data

  const defaultPageSlug = normalizeDocPageSlug(
    data?.defaultPageSlug ?? originalDoc?.defaultPageSlug,
  )
  if (!defaultPageSlug) return data

  const navItems = normalizeDocVersionNavItems(data?.navItems ?? originalDoc?.navItems)
  const pageIds = collectDocVersionNavPageIds(navItems)
  const pageDocs = await findManyByIds(req, 'docPages', pageIds)

  const pageSlugById = new Map<string, string>()
  pageDocs.forEach((pageDoc) => {
    pageSlugById.set(
      String(pageDoc.id),
      normalizeDocPageSlug((pageDoc as unknown as Record<string, unknown>).slug),
    )
  })

  const publishedRows = flattenDocVersionNavRows(navItems).filter((row) => row.published)
  const hasDefault = publishedRows.some(
    (row) => pageSlugById.get(String(row.pageId)) === defaultPageSlug,
  )
  if (hasDefault) return data

  throwValidationError(collection?.slug, req, [
    {
      path: 'defaultPageSlug',
      message:
        'Published versions require defaultPageSlug to match a selected and published page in nav items.',
    },
  ])
}

const updateLatestVersion: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const currentServiceId = extractServiceId(doc.service)
  const previousServiceId = extractServiceId(previousDoc?.service)

  await syncLatestVersionForServices(req, currentServiceId, previousServiceId)
}

const updateLatestVersionOnDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const serviceId = extractServiceId(doc.service)
  await syncLatestVersionForServices(req, serviceId, null)
}

const syncAdminLabel: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const version =
    typeof data?.version === 'string' ? data.version.trim() : originalDoc?.version?.trim()
  if (!version) return data

  const service = (data?.service as RelationValue) ?? (originalDoc?.service as RelationValue)
  const serviceName = await resolveServiceName(req, service)

  return {
    ...(data ?? {}),
    adminLabel: formatAdminLabel(version, serviceName),
  }
}

const attachAdminLabel: CollectionAfterReadHook = async ({ doc, req }) => {
  const version = typeof doc?.version === 'string' ? doc.version.trim() : ''
  if (!version) return doc

  const serviceName = await resolveServiceName(req, doc?.service as RelationValue)

  return {
    ...doc,
    adminLabel: formatAdminLabel(version, serviceName),
  }
}

export const DocVersions: CollectionConfig = {
  slug: 'docVersions',
  admin: {
    useAsTitle: 'adminLabel',
    defaultColumns: ['version', 'service', 'status', 'isPrerelease', 'updatedAt'],
  },
  access: {
    read: readPublishedOrRoles(writerRoles),
    create: isWriter,
    update: isWriter,
    delete: isEditor,
  },
  hooks: {
    beforeValidate: [
      syncSemverFields,
      normalizeDefaultPageSlugHook,
      syncAdminLabel,
      enforceNavItemsIntegrity,
    ],
    beforeChange: [
      setVersionStatusFromNavItems,
      enforcePublishPermissions('Doc version'),
      enforceDefaultPageSlugMatchesPublishedNav,
    ],
    afterChange: [updateLatestVersion],
    afterDelete: [updateLatestVersionOnDelete],
    afterRead: [attachAdminLabel],
  },
  fields: [
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      required: true,
      index: true,
    },
    {
      name: 'version',
      type: 'text',
      required: true,
      admin: {
        description: 'Semver string without a leading "v" (e.g. "1.2.3").',
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'Version is required.'
        }

        try {
          parseSemver(value)
          return true
        } catch (error) {
          if (error instanceof Error && error.message) {
            return error.message
          }

          return 'Version must follow semver (e.g. "1.2.3" or "1.2.3-alpha.1").'
        }
      },
    },
    {
      name: 'adminLabel',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'defaultPageSlug',
      type: 'text',
      required: true,
      admin: {
        description: 'Doc page slug to use as the default landing page for this version.',
      },
      validate: (value: unknown) => validateDocPathSlug(value, 'Default page slug'),
    },
    {
      name: 'navItems',
      type: 'blocks',
      required: true,
      defaultValue: [],
      blocks: [
        {
          slug: 'pageItem',
          labels: {
            singular: 'Page Item',
            plural: 'Page Items',
          },
          fields: [
            {
              name: 'page',
              type: 'relationship',
              relationTo: 'docPages',
              required: true,
              filterOptions: filterNavItemsByService,
            },
            {
              name: 'published',
              type: 'checkbox',
              defaultValue: true,
            },
          ],
        },
        {
          slug: 'groupItem',
          labels: {
            singular: 'Group Item',
            plural: 'Group Items',
          },
          fields: [
            {
              name: 'group',
              type: 'relationship',
              relationTo: 'docPageGroups',
              required: true,
              filterOptions: filterNavItemsByService,
            },
            {
              name: 'pages',
              type: 'array',
              labels: {
                singular: 'Page',
                plural: 'Pages',
              },
              defaultValue: [],
              fields: [
                {
                  name: 'page',
                  type: 'relationship',
                  relationTo: 'docPages',
                  required: true,
                  filterOptions: filterNavItemsByService,
                },
                {
                  name: 'published',
                  type: 'checkbox',
                  defaultValue: true,
                },
              ],
            },
          ],
        },
      ],
      admin: {
        description:
          'Version-owned navigation model. Ordered root items with nested group pages, including per-row published flags.',
      },
    },
    {
      name: 'navWarnings',
      type: 'textarea',
      admin: {
        readOnly: true,
        description:
          'Validation warnings. Duplicate published slugs are auto-demoted to draft and listed here.',
      },
    },
    {
      name: 'versionKey',
      type: 'text',
      admin: {
        description: 'Computed sortable key derived from the semver.',
        readOnly: true,
      },
    },
    {
      name: 'isPrerelease',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      admin: {
        readOnly: true,
        description: 'Automatically derived from published rows in this version navigation.',
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
  ],
}
