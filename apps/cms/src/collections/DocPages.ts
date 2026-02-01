import type { CollectionConfig } from 'payload'

import { isEditor, isWriter, readPublishedOrRoles, writerRoles } from '../access/roles'
import { enforcePublishPermissions, enforceVersionPublished } from '../access/publish'
import { docsLexicalEditor } from '../utils/docsEditor'

export const DocPages: CollectionConfig = {
  slug: 'docPages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'service', 'version', 'slug', 'status', 'updatedAt'],
  },
  access: {
    read: readPublishedOrRoles(writerRoles),
    create: isWriter,
    update: isWriter,
    delete: isEditor,
  },
  hooks: {
    beforeChange: [enforcePublishPermissions('Doc page'), enforceVersionPublished],
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
      editor: docsLexicalEditor,
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
