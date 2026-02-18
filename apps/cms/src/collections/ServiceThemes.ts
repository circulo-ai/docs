import type { CollectionConfig, Field } from 'payload'

import { validateTrimmedRequired } from '../utils/fieldValidation'
import {
  SERVICE_THEME_COLOR_TOKENS,
  SERVICE_THEME_DARK_DEFAULTS,
  SERVICE_THEME_DARK_TOKENS,
  SERVICE_THEME_LIGHT_DEFAULTS,
  SERVICE_THEME_LIGHT_TOKENS,
  serviceThemeTokenLabel,
  serviceThemeTokenToCssVariable,
  serviceThemeTokenToFieldName,
  type ServiceThemeToken,
} from '../utils/serviceThemeTokens'

const buildTokenField = (
  token: ServiceThemeToken,
  mode: 'light' | 'dark',
  defaultValue: string,
): Field => ({
  name: serviceThemeTokenToFieldName(token),
  label: serviceThemeTokenLabel(token),
  type: 'text',
  required: true,
  defaultValue,
  admin: {
    description: `${mode === 'light' ? ':root' : '.dark'} ${serviceThemeTokenToCssVariable(token)}`,
    components: {
      Field: './components/ThemeTokenField',
    },
    custom: {
      colorPreview: SERVICE_THEME_COLOR_TOKENS.has(token),
      placeholder: defaultValue,
    },
  },
  validate: (value: unknown) =>
    validateTrimmedRequired(
      value,
      `${mode === 'light' ? 'Light' : 'Dark'} ${serviceThemeTokenLabel(token)}`,
    ),
})

const buildLightFields = () =>
  SERVICE_THEME_LIGHT_TOKENS.map((token) =>
    buildTokenField(token, 'light', SERVICE_THEME_LIGHT_DEFAULTS[token]),
  )

const buildDarkFields = () =>
  SERVICE_THEME_DARK_TOKENS.map((token) =>
    buildTokenField(token, 'dark', SERVICE_THEME_DARK_DEFAULTS[token]),
  )

export const ServiceThemes: CollectionConfig = {
  slug: 'serviceThemes',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      validate: (value: unknown) => validateTrimmedRequired(value, 'Theme name'),
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Light',
          fields: [
            {
              name: 'light',
              type: 'group',
              fields: buildLightFields(),
            },
          ],
        },
        {
          label: 'Dark',
          fields: [
            {
              name: 'dark',
              type: 'group',
              fields: buildDarkFields(),
            },
          ],
        },
      ],
    },
  ],
}
