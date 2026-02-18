import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { isEditor, isWriter } from '../access/roles'
import { pruneDeletedGroupFromVersions } from '../access/publish'
import { validateOptionalTrimmedString, validateTrimmedRequired } from '../utils/fieldValidation'

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

const syncSlug: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const name = typeof data?.name === 'string' ? data.name : originalDoc?.name
  if (!name) return data

  return {
    ...(data ?? {}),
    slug: slugify(name),
  }
}

export const DocPageGroups: CollectionConfig = {
  slug: 'docPageGroups',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'service', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isWriter,
    update: isWriter,
    delete: isEditor,
  },
  hooks: {
    beforeValidate: [syncSlug],
    afterDelete: [pruneDeletedGroupFromVersions],
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
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Label used in the docs sidebar (e.g. "Getting Started").',
      },
      validate: (value: unknown) => validateTrimmedRequired(value, 'Group name'),
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated from the group name.',
      },
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
      validate: (value: unknown) => validateOptionalTrimmedString(value, 'Group description'),
    },
  ],
}
