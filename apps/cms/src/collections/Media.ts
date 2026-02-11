import type { CollectionConfig } from 'payload'
import { validateTrimmedRequired } from '../utils/fieldValidation'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      validate: (value: unknown) => validateTrimmedRequired(value, 'Alt text'),
    },
  ],
  upload: { disableLocalStorage: true },
}
