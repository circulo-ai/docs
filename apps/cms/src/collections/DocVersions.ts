import type { CollectionConfig } from 'payload'

export const DocVersions: CollectionConfig = {
  slug: 'docVersions',
  admin: {
    useAsTitle: 'version',
    defaultColumns: ['version', 'service', 'status', 'isPrerelease', 'updatedAt'],
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
      },
    },
    {
      name: 'isPrerelease',
      type: 'checkbox',
      defaultValue: false,
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
