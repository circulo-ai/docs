import type { CollectionBeforeChangeHook } from 'payload'

import { editorRoles, hasRole } from './roles'

export const enforcePublishPermissions =
  (label: string): CollectionBeforeChangeHook =>
  ({ data, originalDoc, req }) => {
    const canPublish = hasRole(req.user, editorRoles)
    const nextStatus = data?.status ?? originalDoc?.status
    const wasPublished = originalDoc?.status === 'published'

    if (!canPublish) {
      if (nextStatus === 'published') {
        throw new Error(`${label} can only be published by editors or admins.`)
      }
      if (wasPublished) {
        throw new Error(
          `${label} is already published and can only be edited by editors or admins.`,
        )
      }
    }

    return data
  }
