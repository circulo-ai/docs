import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'
import { ValidationError } from 'payload'

import { isEditor, isWriter, readPublishedOrRoles, writerRoles } from '../access/roles'
import {
  enforcePageDeleteIntegrity,
  enforcePageServiceMatchesVersion,
  enforcePublishPermissions,
  enforcePublishedPageState,
  syncVersionStatusForPageDelete,
  syncVersionStatusesForPageChange,
} from '../access/publish'
import { docsLexicalEditor } from '../utils/docsEditor'
import { validateDocPathSlug, validateTrimmedRequired } from '../utils/fieldValidation'

type RelationValue = number | string | { id?: number | string } | null | undefined

const getRelationId = (value: RelationValue) => {
  if (!value) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object' && value.id !== undefined) return value.id
  return null
}

const sameId = (a: number | string | null, b: number | string | null) =>
  a !== null && b !== null && String(a) === String(b)

const sameNullableId = (a: number | string | null, b: number | string | null) =>
  (a === null && b === null) || sameId(a, b)

const resolveOrderMode = (value: unknown): 'manual' | 'auto' =>
  value === 'auto' ? 'auto' : 'manual'

const resolveManualOrder = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const normalized = Math.floor(value)
  return normalized < 1 ? 1 : normalized
}

const enforceVersionBelongsToService: CollectionBeforeValidateHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  const serviceId = getRelationId(
    (data?.service as RelationValue) ?? (originalDoc?.service as RelationValue),
  )
  const versionId = getRelationId(
    (data?.version as RelationValue) ?? (originalDoc?.version as RelationValue),
  )

  if (!serviceId || !versionId) return data

  let versionDoc
  try {
    versionDoc = await req.payload.findByID({
      collection: 'docVersions',
      id: versionId,
      req,
      overrideAccess: false,
      depth: 0,
    })
  } catch {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [
        {
          path: 'version',
          message: 'Selected doc version could not be found.',
        },
      ],
      req,
    })
  }

  const versionServiceId = getRelationId(versionDoc?.service as RelationValue)

  if (!sameId(versionServiceId, serviceId)) {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [
        {
          path: 'version',
          message: 'Selected doc version must belong to the same service as this page.',
        },
      ],
      req,
    })
  }

  return data
}

export const enforceUniqueManualDocPageOrder: CollectionBeforeValidateHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  const nextOrderMode = resolveOrderMode(data?.orderMode ?? originalDoc?.orderMode)
  if (nextOrderMode !== 'manual') return data

  const serviceId = getRelationId(
    (data?.service as RelationValue) ?? (originalDoc?.service as RelationValue),
  )
  const versionId = getRelationId(
    (data?.version as RelationValue) ?? (originalDoc?.version as RelationValue),
  )
  const groupId = getRelationId((data?.group as RelationValue) ?? (originalDoc?.group as RelationValue))
  const nextOrder = resolveManualOrder(data?.order ?? originalDoc?.order ?? 1)

  if (!serviceId || !versionId || nextOrder === null) return data

  const originalOrderMode = resolveOrderMode(originalDoc?.orderMode)
  const originalOrder = resolveManualOrder(originalDoc?.order ?? 1)
  const originalServiceId = getRelationId(originalDoc?.service as RelationValue)
  const originalVersionId = getRelationId(originalDoc?.version as RelationValue)
  const originalGroupId = getRelationId(originalDoc?.group as RelationValue)

  const orderScopeChanged =
    originalOrderMode !== nextOrderMode ||
    originalOrder !== nextOrder ||
    !sameId(serviceId, originalServiceId) ||
    !sameId(versionId, originalVersionId) ||
    !sameNullableId(groupId, originalGroupId)

  if (originalDoc?.id && !orderScopeChanged) return data

  const duplicateResult = await req.payload.find({
    collection: 'docPages',
    where: {
      and: [
        {
          service: {
            equals: serviceId,
          },
        },
        {
          version: {
            equals: versionId,
          },
        },
        {
          orderMode: {
            equals: 'manual',
          },
        },
        {
          order: {
            equals: nextOrder,
          },
        },
        groupId
          ? {
              group: {
                equals: groupId,
              },
            }
          : {
              group: {
                exists: false,
              },
            },
      ],
    },
    limit: 1,
    depth: 0,
    req,
    overrideAccess: false,
  })

  const duplicate = duplicateResult.docs[0]
  if (!duplicate || (originalDoc?.id && String(duplicate.id) === String(originalDoc.id))) {
    return data
  }

  throw new ValidationError({
    collection: collection?.slug,
    errors: [
      {
        path: 'order',
        message:
          'Manual order must be unique in this location (same service/version and group scope).',
      },
    ],
    req,
  })
}

const enforceGroupMatchesServiceAndVersion: CollectionBeforeChangeHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  const groupId = getRelationId(
    (data?.group as RelationValue) ?? (originalDoc?.group as RelationValue),
  )
  if (!groupId) return data

  const serviceId = getRelationId(
    (data?.service as RelationValue) ?? (originalDoc?.service as RelationValue),
  )
  const versionId = getRelationId(
    (data?.version as RelationValue) ?? (originalDoc?.version as RelationValue),
  )

  if (!serviceId || !versionId) {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [
        {
          path: 'group',
          message: 'Select a service and version before assigning a page group.',
        },
      ],
      req,
    })
  }

  let groupDoc
  try {
    groupDoc = await req.payload.findByID({
      collection: 'docPageGroups',
      id: groupId,
      req,
      overrideAccess: false,
      depth: 0,
    })
  } catch {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [
        {
          path: 'group',
          message: 'Selected page group could not be found.',
        },
      ],
      req,
    })
  }

  const groupServiceId = getRelationId(groupDoc?.service as RelationValue)
  const groupVersionId = getRelationId(groupDoc?.version as RelationValue)

  if (!sameId(groupServiceId, serviceId) || !sameId(groupVersionId, versionId)) {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [
        {
          path: 'group',
          message: 'Selected page group must belong to the same service and version as this page.',
        },
      ],
      req,
    })
  }

  return data
}

export const DocPages: CollectionConfig = {
  slug: 'docPages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'service',
      'version',
      'group',
      'orderMode',
      'order',
      'slug',
      'status',
      'updatedAt',
    ],
  },
  access: {
    read: readPublishedOrRoles(writerRoles),
    create: isWriter,
    update: isWriter,
    delete: isEditor,
  },
  hooks: {
    beforeValidate: [enforceVersionBelongsToService, enforceUniqueManualDocPageOrder],
    beforeChange: [
      enforcePublishPermissions('Doc page'),
      enforcePageServiceMatchesVersion,
      enforcePublishedPageState,
      enforceGroupMatchesServiceAndVersion,
    ],
    beforeDelete: [enforcePageDeleteIntegrity],
    afterChange: [syncVersionStatusesForPageChange],
    afterDelete: [syncVersionStatusForPageDelete],
  },
  indexes: [
    {
      fields: ['service', 'version', 'slug'],
      unique: true,
    },
  ],
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
      type: 'relationship',
      relationTo: 'docVersions',
      required: true,
      index: true,
      admin: {
        description: 'Select a service first. Only versions for that service are available.',
      },
      filterOptions: ({ siblingData, data }) => {
        const values = (siblingData ?? data) as { service?: RelationValue } | undefined
        const serviceId = getRelationId(values?.service ?? null)

        if (!serviceId) return false

        return {
          service: {
            equals: serviceId,
          },
        }
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'Path segments for the page (lowercase kebab-case, use "/" for nested paths).',
      },
      validate: (value: unknown) => validateDocPathSlug(value, 'Doc page slug'),
    },
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'docPageGroups',
      admin: {
        position: 'sidebar',
        description: 'Optional sidebar group for this page.',
      },
      filterOptions: ({ siblingData, data }) => {
        const siblingValues = (siblingData ?? data) as
          | { service?: RelationValue; version?: RelationValue }
          | undefined
        const serviceId = getRelationId(siblingValues?.service ?? null)
        const versionId = getRelationId(siblingValues?.version ?? null)

        if (!serviceId || !versionId) return false

        return {
          service: {
            equals: serviceId,
          },
          version: {
            equals: versionId,
          },
        }
      },
    },
    {
      name: 'orderMode',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        {
          label: 'Manual',
          value: 'manual',
        },
        {
          label: 'Auto (Created At)',
          value: 'auto',
        },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Manual uses the Order field. Auto uses Created At (oldest first, newest last).',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 1,
      min: 1,
      admin: {
        position: 'sidebar',
        description: '1-based manual position. Example: 3 places this page as the third item.',
        condition: (_, siblingData) =>
          ((siblingData as { orderMode?: string } | undefined)?.orderMode ?? 'manual') !== 'auto',
      },
      validate: (value: unknown, { siblingData }: { siblingData?: unknown }) => {
        const orderMode = resolveOrderMode(
          (siblingData as { orderMode?: unknown } | undefined)?.orderMode,
        )
        if (orderMode !== 'manual') return true

        if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
          return 'Order must be an integer.'
        }

        if (value < 1) {
          return 'Order must be at least 1.'
        }

        return true
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      validate: (value: unknown) => validateTrimmedRequired(value, 'Title'),
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: docsLexicalEditor,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
  ],
}
