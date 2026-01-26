import type { CollectionConfig } from 'payload'

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  admin: {
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'service', 'version', 'permanent', 'updatedAt'],
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
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      admin: {
        description: 'Destination path or URL.',
      },
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
    },
    {
      name: 'version',
      type: 'relationship',
      relationTo: 'docVersions',
    },
    {
      name: 'permanent',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
