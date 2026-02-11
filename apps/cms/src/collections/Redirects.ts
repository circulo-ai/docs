import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { validateRedirectFrom, validateRedirectTo } from '../utils/fieldValidation'

type RelationValue = number | string | { id?: number | string } | null | undefined

const getRelationId = (value: RelationValue) => {
  if (!value) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object' && value.id !== undefined) return value.id
  return null
}

const sameId = (a: number | string | null, b: number | string | null) =>
  a !== null && b !== null && String(a) === String(b)

const enforceVersionBelongsToService: CollectionBeforeValidateHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  const versionId = getRelationId(
    (data?.version as RelationValue) ?? (originalDoc?.version as RelationValue),
  )
  if (!versionId) return data

  const serviceId = getRelationId(
    (data?.service as RelationValue) ?? (originalDoc?.service as RelationValue),
  )
  if (!serviceId) {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [
        {
          path: 'service',
          message: 'Select a service when assigning a doc version.',
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
          message: 'Selected doc version must belong to the same service as this redirect.',
        },
      ],
      req,
    })
  }

  return data
}

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  admin: {
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'service', 'version', 'permanent', 'updatedAt'],
  },
  hooks: {
    beforeValidate: [enforceVersionBelongsToService],
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Incoming path to redirect (e.g. "/guides/old").',
      },
      validate: (value: unknown) => validateRedirectFrom(value),
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      admin: {
        description: 'Destination path or URL ("/..." or "https://...").',
      },
      validate: (
        value: unknown,
        { siblingData }: { siblingData?: { from?: unknown } },
      ) => validateRedirectTo(value, { from: siblingData?.from }),
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      admin: {
        description: 'Optional service scope for this redirect.',
      },
    },
    {
      name: 'version',
      type: 'relationship',
      relationTo: 'docVersions',
      admin: {
        description: 'Optional version scope. Select a service first.',
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
      name: 'permanent',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
