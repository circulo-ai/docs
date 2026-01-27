import type { CollectionBeforeChangeHook } from 'payload'
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
