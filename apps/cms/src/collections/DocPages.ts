import type { CollectionConfig } from 'payload'

export const DocPages: CollectionConfig = {
  slug: 'docPages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'service', 'version', 'slug', 'status', 'updatedAt'],
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
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
