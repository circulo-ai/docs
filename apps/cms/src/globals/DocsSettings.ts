import type { GlobalConfig } from 'payload'

import { isEditor } from '../access/roles'
import { docsLexicalEditor } from '../utils/docsEditor'
import { validateOptionalTrimmedString, validateTrimmedRequired } from '../utils/fieldValidation'

const extraNavLinkVariantOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Outline', value: 'outline' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Ghost', value: 'ghost' },
  { label: 'Destructive', value: 'destructive' },
  { label: 'Link', value: 'link' },
]

const extraNavLinkTargetOptions = [
  { label: 'Same Tab', value: '_self' },
  { label: 'New Tab', value: '_blank' },
  { label: 'Parent Frame', value: '_parent' },
  { label: 'Top Frame', value: '_top' },
]

export const DocsSettings: GlobalConfig = {
  slug: 'docsSettings',
  access: {
    read: () => true,
    update: isEditor,
  },
  fields: [
    {
      name: 'homeTitle',
      type: 'text',
      admin: {
        description: 'Optional title displayed on the landing page.',
      },
      validate: (value: unknown) => validateOptionalTrimmedString(value, 'Home title'),
    },
    {
      name: 'homeDescription',
      type: 'textarea',
      admin: {
        description: 'Optional description displayed on the landing page.',
      },
      validate: (value: unknown) => validateOptionalTrimmedString(value, 'Home description'),
    },
    {
      name: 'extraNavLinks',
      type: 'array',
      labels: {
        singular: 'Extra Nav Link',
        plural: 'Extra Nav Links',
      },
      admin: {
        description:
          'Optional links displayed under the service/version switcher in the docs sidebar.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          validate: (value: unknown) => validateTrimmedRequired(value, 'Link label'),
        },
        {
          name: 'href',
          type: 'text',
          required: true,
          admin: {
            description: 'Supports relative paths, hash fragments, and absolute URLs.',
          },
          validate: (value: unknown) => validateTrimmedRequired(value, 'Link URL'),
        },
        {
          name: 'icon',
          type: 'text',
          admin: {
            description:
              'Optional Lucide icon name displayed before the label (for example: Link2).',
          },
          validate: (value: unknown) => validateOptionalTrimmedString(value, 'Link icon'),
        },
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'outline',
          options: extraNavLinkVariantOptions,
          admin: {
            description: 'Button style variant used when rendering this link.',
          },
        },
        {
          name: 'target',
          type: 'select',
          options: extraNavLinkTargetOptions,
          admin: {
            description: 'Where to open this link.',
          },
        },
      ],
    },
    {
      name: 'homeContent',
      type: 'richText',
      required: true,
      editor: docsLexicalEditor,
      admin: {
        description: 'Landing page content shown at /.',
      },
    },
  ],
}
