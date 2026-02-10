import type {
  CollectionAfterChangeHook,
  CollectionAfterReadHook,
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  PayloadRequest,
} from 'payload'

import { isWriter, readPublishedOrRoles, writerRoles, isEditor } from '../access/roles'
import { enforcePublishPermissions, enforceVersionStateIntegrity } from '../access/publish'
import { validateDocPathSlug } from '../utils/fieldValidation'
import { extractServiceId, syncLatestVersionForServices } from '../utils/latestVersion'
import { buildVersionKey, parseSemver } from '../utils/semver'

type RelationValue = number | string | { id?: number | string; name?: unknown } | null | undefined

const getRelationId = (value: RelationValue) => {
  if (!value) return null
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'object' && value.id !== undefined) return value.id
  return null
}

const getRelationName = (value: RelationValue) => {
  if (!value || typeof value !== 'object') return null
  if (typeof value.name !== 'string') return null
  const trimmed = value.name.trim()
  return trimmed.length > 0 ? trimmed : null
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
    beforeValidate: [syncSemverFields, normalizeDefaultPageSlugHook, syncAdminLabel],
    beforeChange: [enforcePublishPermissions('Doc version'), enforceVersionStateIntegrity],
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
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
  ],
}
