import type { GlobalConfig } from 'payload'

import { isEditor } from '../access/roles'

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
        description: 'Optional title displayed on the /docs landing page.',
      },
    },
    {
      name: 'homeDescription',
      type: 'textarea',
      admin: {
        description: 'Optional description displayed on the /docs landing page.',
      },
    },
    {
      name: 'homeContent',
      type: 'richText',
      required: true,
      admin: {
        description: 'Landing page content shown at /docs.',
      },
    },
  ],
}
