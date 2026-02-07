import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { isEditor, isWriter, readPublishedOrRoles, writerRoles } from '../access/roles'
import { enforcePublishPermissions, enforceVersionPublished } from '../access/publish'
import { docsLexicalEditor } from '../utils/docsEditor'

type RelationValue = number | string | { id?: number | string } | null | undefined

const getRelationId = (value: RelationValue) => {
  if (!value) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object' && value.id !== undefined) return value.id
  return null
}

const sameId = (a: number | string | null, b: number | string | null) =>
  a !== null && b !== null && String(a) === String(b)

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
    defaultColumns: ['title', 'service', 'version', 'group', 'slug', 'status', 'updatedAt'],
  },
  access: {
    read: readPublishedOrRoles(writerRoles),
    create: isWriter,
    update: isWriter,
    delete: isEditor,
  },
  hooks: {
    beforeChange: [
      enforcePublishPermissions('Doc page'),
      enforceVersionPublished,
      enforceGroupMatchesServiceAndVersion,
    ],
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
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'Path segments for the page (use "/" for nested paths).',
      },
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
      name: 'title',
      type: 'text',
      required: true,
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
