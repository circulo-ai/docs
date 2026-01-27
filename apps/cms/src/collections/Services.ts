import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL prefix for this service (e.g. "api", "cli").',
      },
    },
    {
      name: 'theme',
      type: 'group',
      fields: [
        {
          name: 'primaryColor',
          type: 'text',
          admin: {
            description: 'CSS color token for primary UI elements.',
          },
        },
        {
          name: 'secondaryColor',
          type: 'text',
          admin: {
            description: 'CSS color token for secondary UI elements.',
          },
        },
        {
          name: 'accentColor',
          type: 'text',
          admin: {
            description: 'CSS color token for accents and highlights.',
          },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'searchDefaults',
      type: 'group',
      fields: [
        {
          name: 'placeholder',
          type: 'text',
          admin: {
            description: 'Placeholder text for the search input.',
          },
        },
        {
          name: 'includeOlderVersions',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'resultsLimit',
          type: 'number',
          min: 1,
          defaultValue: 20,
        },
      ],
    },
    {
      name: 'latestVersion',
      type: 'relationship',
      relationTo: 'docVersions',
      admin: {
        readOnly: true,
        description: 'Automatically set to the newest published version for this service.',
      },
    },
  ],
}
