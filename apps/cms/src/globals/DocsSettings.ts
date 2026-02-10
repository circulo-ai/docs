import type { GlobalConfig } from 'payload'

import { isEditor } from '../access/roles'
import { docsLexicalEditor } from '../utils/docsEditor'
import { validateOptionalTrimmedString } from '../utils/fieldValidation'

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
