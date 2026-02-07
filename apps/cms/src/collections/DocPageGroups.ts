import type {
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'
import { ValidationError } from 'payload'

import { isEditor, isWriter } from '../access/roles'

type RelationValue = number | string | { id?: number | string } | null | undefined

const getRelationId = (value: RelationValue) => {
  if (!value) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object' && value.id !== undefined) return value.id
  return null
}

const sameId = (a: number | string | null, b: number | string | null) =>
  a !== null && b !== null && String(a) === String(b)

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
    defaultColumns: ['name', 'service', 'version', 'order', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isWriter,
    update: isWriter,
    delete: isEditor,
  },
  hooks: {
    beforeValidate: [syncSlug, enforceVersionBelongsToService],
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
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Lower values are shown first in the sidebar.',
      },
    },
  ],
}
