import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'

import { isWriter, readPublishedOrRoles, writerRoles, isEditor } from '../access/roles'
import { enforcePublishPermissions } from '../access/publish'
import { extractServiceId, syncLatestVersionForServices } from '../utils/latestVersion'
import { buildVersionKey, parseSemver } from '../utils/semver'

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

const updateLatestVersion: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const currentServiceId = extractServiceId(doc.service)
  const previousServiceId = extractServiceId(previousDoc?.service)

  await syncLatestVersionForServices(req, currentServiceId, previousServiceId)
}

const updateLatestVersionOnDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const serviceId = extractServiceId(doc.service)
  await syncLatestVersionForServices(req, serviceId, null)
}

export const DocVersions: CollectionConfig = {
  slug: 'docVersions',
  admin: {
    useAsTitle: 'version',
    defaultColumns: ['version', 'service', 'status', 'isPrerelease', 'updatedAt'],
  },
  access: {
    read: readPublishedOrRoles(writerRoles),
    create: isWriter,
    update: isWriter,
    delete: isEditor,
  },
  hooks: {
    beforeValidate: [syncSemverFields],
    beforeChange: [enforcePublishPermissions('Doc version')],
    afterChange: [updateLatestVersion],
    afterDelete: [updateLatestVersionOnDelete],
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
    },
    {
      name: 'defaultPageSlug',
      type: 'text',
      required: true,
      admin: {
        description: 'Doc page slug to use as the default landing page for this version.',
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
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
  ],
}
