import type {
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'
import { ValidationError } from 'payload'

import { isEditor, isWriter } from '../access/roles'
import { validateOptionalTrimmedString, validateTrimmedRequired } from '../utils/fieldValidation'

type RelationValue = number | string | { id?: number | string } | null | undefined

const getRelationId = (value: RelationValue) => {
  if (!value) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object' && value.id !== undefined) return value.id
  return null
}

const sameId = (a: number | string | null, b: number | string | null) =>
  a !== null && b !== null && String(a) === String(b)

const resolveOrderMode = (value: unknown): 'manual' | 'auto' =>
  value === 'auto' ? 'auto' : 'manual'

const resolveManualOrder = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const normalized = Math.floor(value)
  return normalized < 1 ? 1 : normalized
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

const syncSlug: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const name = typeof data?.name === 'string' ? data.name : originalDoc?.name
  if (!name) return data

  return {
    ...(data ?? {}),
    slug: slugify(name),
  }
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
          message: 'Selected doc version must belong to the same service as this group.',
        },
      ],
      req,
    })
  }

  return data
}

export const enforceUniqueManualDocPageGroupOrder: CollectionBeforeValidateHook = async ({
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
  const nextOrder = resolveManualOrder(data?.order ?? originalDoc?.order ?? 1)

  if (!serviceId || !versionId || nextOrder === null) return data

  const originalOrderMode = resolveOrderMode(originalDoc?.orderMode)
  const originalOrder = resolveManualOrder(originalDoc?.order ?? 1)
  const originalServiceId = getRelationId(originalDoc?.service as RelationValue)
  const originalVersionId = getRelationId(originalDoc?.version as RelationValue)

  const orderScopeChanged =
    originalOrderMode !== nextOrderMode ||
    originalOrder !== nextOrder ||
    !sameId(serviceId, originalServiceId) ||
    !sameId(versionId, originalVersionId)

  if (originalDoc?.id && !orderScopeChanged) return data

  const duplicateResult = await req.payload.find({
    collection: 'docPageGroups',
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
        message: 'Manual order must be unique for groups in this service version.',
      },
    ],
    req,
  })
}

const clearDeletedGroupFromPages: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await req.payload.update({
    collection: 'docPages',
    where: {
      group: {
        equals: doc.id,
      },
    },
    data: {
      group: null,
    },
    req,
    overrideAccess: true,
    depth: 0,
  })
}

export const DocPageGroups: CollectionConfig = {
  slug: 'docPageGroups',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'service', 'version', 'orderMode', 'order', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isWriter,
    update: isWriter,
    delete: isEditor,
  },
  hooks: {
    beforeValidate: [syncSlug, enforceVersionBelongsToService, enforceUniqueManualDocPageGroupOrder],
    afterDelete: [clearDeletedGroupFromPages],
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
      filterOptions: ({ siblingData, data }) => {
        const values = (siblingData ?? data) as { service?: RelationValue } | undefined
        const serviceId = getRelationId(values?.service ?? null)
        if (!serviceId) return true

        return {
          service: {
            equals: serviceId,
          },
        }
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Label used in the docs sidebar (e.g. "Getting Started").',
      },
      validate: (value: unknown) => validateTrimmedRequired(value, 'Group name'),
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated from the group name.',
      },
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
      validate: (value: unknown) => validateOptionalTrimmedString(value, 'Group description'),
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
        description: '1-based manual position. Example: 3 places this group as the third item.',
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
  ],
}
