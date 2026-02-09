import type { CollectionConfig } from 'payload'

import { isAdminField } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Writer', value: 'writer' },
        { label: 'Editor', value: 'editor' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: ['writer'],
      required: true,
      saveToJWT: true,
      access: {
        update: isAdminField,
      },
    },
  ],
}
