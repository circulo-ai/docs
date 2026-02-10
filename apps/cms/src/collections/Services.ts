import type { CollectionConfig } from 'payload'
import { DEFAULT_SERVICE_ICON, serviceIconOptions } from '../utils/serviceIcons'
import {
  validateOptionalTrimmedString,
  validateServiceSlug,
  validateTrimmedRequired,
} from '../utils/fieldValidation'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'icon', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data || typeof data !== 'object') return data
        const iconValue = (data as { icon?: unknown }).icon
        if (typeof iconValue === 'string') {
          return {
            ...data,
            icon: {
              source: 'lucide',
              lucide: iconValue,
            },
          }
        }
        return data
      },
    ],
    afterRead: [
      ({ doc }) => {
        const iconValue = (doc as { icon?: unknown }).icon
        if (typeof iconValue === 'string') {
          return {
            ...doc,
            icon: {
              source: 'lucide',
              lucide: iconValue,
            },
          }
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      validate: (value: unknown) => validateTrimmedRequired(value, 'Service name'),
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
      validate: (value: unknown) => validateServiceSlug(value),
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'Short summary shown in the docs service selector. Keep this concise (1-2 lines).',
      },
      validate: (value: unknown) => validateTrimmedRequired(value, 'Service description'),
    },
    {
      name: 'icon',
      type: 'group',
      admin: {
        description: 'Icon used in the docs service selector.',
        components: {
          Cell: './components/IconCell',
        },
      },
      fields: [
        {
          name: 'source',
          type: 'radio',
          defaultValue: 'lucide',
          options: [
            { label: 'Lucide', value: 'lucide' },
            { label: 'Custom SVG', value: 'custom' },
          ],
          admin: {
            layout: 'horizontal',
          },
        },
        {
          name: 'lucide',
          type: 'select',
          defaultValue: DEFAULT_SERVICE_ICON,
          options: serviceIconOptions,
          admin: {
            description: 'Search the Lucide icon library by name.',
            condition: (_, siblingData) => siblingData?.source !== 'custom',
            components: {
              Field: './components/IconSelectField',
            },
          },
          validate: (value: unknown, { siblingData }: { siblingData?: { source?: string } }) => {
            if (siblingData?.source === 'custom') return true
            return value ? true : 'Select a Lucide icon.'
          },
        },
        {
          name: 'customSvg',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Upload an SVG icon.',
            condition: (_, siblingData) => siblingData?.source === 'custom',
          },
          filterOptions: {
            mimeType: { equals: 'image/svg+xml' },
          },
          validate: (value: unknown, { siblingData }: { siblingData?: { source?: string } }) => {
            if (siblingData?.source !== 'custom') return true
            return value ? true : 'Upload an SVG icon.'
          },
        },
      ],
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
          validate: (value: unknown) =>
            validateOptionalTrimmedString(value, 'Search placeholder'),
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
