import type { CollectionConfig } from 'payload'

import { isEditor, isWriter } from '../access/roles'
import {
  enforcePageDeleteIntegrity,
  enforcePageUpdateIntegrity,
  pruneDeletedPageFromVersions,
} from '../access/publish'
import { docsLexicalEditor } from '../utils/docsEditor'
import { validateDocPathSlug, validateTrimmedRequired } from '../utils/fieldValidation'

export const DocPages: CollectionConfig = {
  slug: 'docPages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'service', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isWriter,
    update: isWriter,
    delete: isEditor,
  },
  hooks: {
    beforeChange: [enforcePageUpdateIntegrity],
    beforeDelete: [enforcePageDeleteIntegrity],
    afterDelete: [pruneDeletedPageFromVersions],
  },
  indexes: [
    {
      fields: ['service', 'slug'],
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
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'Path segments for the page (lowercase kebab-case, use "/" for nested paths).',
      },
      validate: (value: unknown) => validateDocPathSlug(value, 'Doc page slug'),
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      validate: (value: unknown) => validateTrimmedRequired(value, 'Title'),
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: docsLexicalEditor,
    },
  ],
}
