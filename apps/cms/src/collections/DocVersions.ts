import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { isWriter, readPublishedOrRoles, writerRoles, isEditor } from '../access/roles'
import { enforcePublishPermissions } from '../access/publish'
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
