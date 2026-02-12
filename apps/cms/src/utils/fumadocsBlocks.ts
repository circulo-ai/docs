import type { Block } from 'payload'
import { DEFAULT_SERVICE_ICON, serviceIconOptions } from './serviceIcons'

type IconFieldOptions = {
  description: string
  condition?: (data: unknown, siblingData: unknown) => boolean
}

const readIconSource = (siblingData: unknown): string | undefined => {
  if (!siblingData || typeof siblingData !== 'object') return undefined
  const source = (siblingData as { source?: unknown }).source
  return typeof source === 'string' ? source : undefined
}

const readEntryKind = (siblingData: unknown): string | undefined => {
  if (!siblingData || typeof siblingData !== 'object') return undefined
  const kind = (siblingData as { kind?: unknown }).kind
  return typeof kind === 'string' ? kind : undefined
}

const iconField = ({
  description,
  condition,
}: IconFieldOptions): NonNullable<Block['fields']>[number] => ({
  name: 'icon',
  type: 'group',
  admin: {
    description,
    condition,
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
        condition: (_, siblingData) => readIconSource(siblingData) !== 'custom',
        components: {
          Field: './components/IconSelectField',
        },
      },
      validate: (value: unknown, { siblingData }: { siblingData?: unknown }) => {
        if (readIconSource(siblingData) === 'custom') return true
        return value ? true : 'Select a Lucide icon.'
      },
    },
    {
      name: 'customSvg',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Upload an SVG icon.',
        condition: (_, siblingData) => readIconSource(siblingData) === 'custom',
      },
      filterOptions: {
        mimeType: { equals: 'image/svg+xml' },
      },
      validate: (value: unknown, { siblingData }: { siblingData?: unknown }) => {
        if (readIconSource(siblingData) !== 'custom') return true
        return value ? true : 'Upload an SVG icon.'
      },
    },
  ],
})

export const fumadocsBlocks: Block[] = [
  {
    slug: 'fumaBanner',
    labels: {
      singular: 'Banner',
      plural: 'Banners',
    },
    fields: [
      {
        name: 'id',
        type: 'text',
        admin: {
          description: 'Optional Banner id used for close-state persistence and anchor targets.',
        },
      },
      {
        name: 'content',
        type: 'text',
        required: true,
      },
      {
        name: 'variant',
        type: 'select',
        defaultValue: 'normal',
        options: [
          { label: 'Normal', value: 'normal' },
          { label: 'Rainbow', value: 'rainbow' },
        ],
      },
      {
        name: 'height',
        type: 'text',
      },
      {
        name: 'rainbowColors',
        type: 'textarea',
        admin: {
          description: 'Optional rainbow colors, one CSS color value per line.',
        },
      },
      {
        name: 'changeLayout',
        type: 'checkbox',
        defaultValue: false,
      },
      {
        name: 'props',
        type: 'json',
        admin: {
          description: 'Additional Banner props as a JSON object.',
        },
      },
    ],
  },
  {
    slug: 'fumaCallout',
    labels: {
      singular: 'Callout',
      plural: 'Callouts',
    },
    fields: [
      {
        name: 'title',
        type: 'text',
      },
      {
        name: 'type',
        type: 'select',
        defaultValue: 'info',
        options: [
          { label: 'Info', value: 'info' },
          { label: 'Warning', value: 'warning' },
          { label: 'Warn', value: 'warn' },
          { label: 'Error', value: 'error' },
          { label: 'Success', value: 'success' },
          { label: 'Idea', value: 'idea' },
        ],
      },
      {
        name: 'content',
        type: 'textarea',
      },
      iconField({ description: 'Optional icon override.' }),
      {
        name: 'props',
        type: 'json',
        admin: {
          description: 'Additional Callout container props as a JSON object.',
        },
      },
    ],
  },
  {
    slug: 'fumaCards',
    labels: {
      singular: 'Cards',
      plural: 'Cards',
    },
    fields: [
      {
        name: 'props',
        type: 'json',
        admin: {
          description: 'Additional Cards container props as a JSON object.',
        },
      },
      {
        name: 'cards',
        type: 'array',
        required: true,
        minRows: 1,
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            type: 'textarea',
          },
          iconField({ description: 'Optional icon for this card.' }),
          {
            name: 'href',
            type: 'text',
          },
          {
            name: 'external',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            name: 'props',
            type: 'json',
            admin: {
              description: 'Additional Card props as a JSON object.',
            },
          },
        ],
      },
    ],
  },
  {
    slug: 'fumaAccordions',
    labels: {
      singular: 'Accordions',
      plural: 'Accordions',
    },
    fields: [
      {
        name: 'type',
        type: 'select',
        defaultValue: 'single',
        options: [
          { label: 'Single', value: 'single' },
          { label: 'Multiple', value: 'multiple' },
        ],
      },
      {
        name: 'defaultOpenValues',
        type: 'text',
        admin: {
          description: 'Comma-separated item values to open by default.',
        },
      },
      {
        name: 'props',
        type: 'json',
        admin: {
          description: 'Additional Accordions props as a JSON object.',
        },
      },
      {
        name: 'items',
        type: 'array',
        required: true,
        minRows: 1,
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'value',
            type: 'text',
          },
          {
            name: 'id',
            type: 'text',
            admin: {
              description: 'Optional heading id for anchor copy links.',
            },
          },
          {
            name: 'content',
            type: 'textarea',
            required: true,
          },
          {
            name: 'props',
            type: 'json',
            admin: {
              description: 'Additional Accordion item props as a JSON object.',
            },
          },
        ],
      },
    ],
  },
  {
    slug: 'fumaTabs',
    labels: {
      singular: 'Tabs',
      plural: 'Tabs',
    },
    fields: [
      {
        name: 'label',
        type: 'text',
      },
      {
        name: 'defaultIndex',
        type: 'number',
        min: 0,
        defaultValue: 0,
      },
      {
        name: 'props',
        type: 'json',
        admin: {
          description: 'Additional Tabs props as a JSON object.',
        },
      },
      {
        name: 'tabs',
        type: 'array',
        required: true,
        minRows: 2,
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'value',
            type: 'text',
          },
          {
            name: 'content',
            type: 'textarea',
            required: true,
          },
          {
            name: 'props',
            type: 'json',
            admin: {
              description: 'Additional Tab props as a JSON object.',
            },
          },
        ],
      },
    ],
  },
  {
    slug: 'fumaSteps',
    labels: {
      singular: 'Steps',
      plural: 'Steps',
    },
    fields: [
      {
        name: 'steps',
        type: 'array',
        required: true,
        minRows: 1,
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'content',
            type: 'textarea',
            required: true,
          },
        ],
      },
    ],
  },
  {
    slug: 'fumaFiles',
    labels: {
      singular: 'Files',
      plural: 'Files',
    },
    fields: [
      {
        name: 'props',
        type: 'json',
        admin: {
          description: 'Additional Files container props as a JSON object.',
        },
      },
      {
        name: 'entries',
        type: 'array',
        required: true,
        minRows: 1,
        fields: [
          {
            name: 'kind',
            type: 'select',
            defaultValue: 'file',
            options: [
              { label: 'File', value: 'file' },
              { label: 'Folder', value: 'folder' },
            ],
          },
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'disabled',
            type: 'checkbox',
            defaultValue: false,
            admin: {
              condition: (_, siblingData) => siblingData.kind === 'folder',
            },
          },
          iconField({
            description: 'Optional icon for file entries.',
            condition: (_, siblingData) => readEntryKind(siblingData) === 'file',
          }),
          {
            name: 'defaultOpen',
            type: 'checkbox',
            defaultValue: false,
            admin: {
              condition: (_, siblingData) => siblingData.kind === 'folder',
            },
          },
          {
            name: 'children',
            type: 'textarea',
            admin: {
              condition: (_, siblingData) => siblingData.kind === 'folder',
              description: 'Child file names for this folder, one per line.',
            },
          },
          {
            name: 'childrenEntries',
            type: 'array',
            admin: {
              condition: (_, siblingData) => siblingData.kind === 'folder',
              description:
                'Optional structured child entries. Used instead of plain text children when set.',
            },
            fields: [
              {
                name: 'name',
                type: 'text',
                required: true,
              },
              iconField({ description: 'Optional icon for this child file.' }),
              {
                name: 'props',
                type: 'json',
                admin: {
                  description: 'Additional File props as a JSON object.',
                },
              },
            ],
          },
          {
            name: 'props',
            type: 'json',
            admin: {
              description:
                'Additional File/Folder props as a JSON object for this entry (based on entry kind).',
            },
          },
        ],
      },
    ],
  },
  {
    slug: 'fumaCodeTabs',
    labels: {
      singular: 'Code Tabs',
      plural: 'Code Tabs',
    },
    fields: [
      {
        name: 'defaultValue',
        type: 'text',
        admin: {
          description: 'Optional default tab value. Falls back to the first tab value.',
        },
      },
      {
        name: 'props',
        type: 'json',
        admin: {
          description: 'Additional CodeBlockTabs props as a JSON object.',
        },
      },
      {
        name: 'tabsListProps',
        type: 'json',
        admin: {
          description: 'Additional CodeBlockTabsList props as a JSON object.',
        },
      },
      {
        name: 'tabs',
        type: 'array',
        required: true,
        minRows: 1,
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'value',
            type: 'text',
          },
          {
            name: 'language',
            type: 'text',
            required: true,
          },
          {
            name: 'code',
            type: 'code',
            required: true,
          },
          {
            name: 'triggerProps',
            type: 'json',
            admin: {
              description: 'Additional CodeBlockTabsTrigger props as a JSON object.',
            },
          },
          {
            name: 'tabProps',
            type: 'json',
            admin: {
              description: 'Additional CodeBlockTab props as a JSON object.',
            },
          },
          {
            name: 'codeblock',
            type: 'json',
            admin: {
              description: 'DynamicCodeBlock codeblock props as a JSON object.',
            },
          },
          {
            name: 'options',
            type: 'json',
            admin: {
              description: 'DynamicCodeBlock shiki options as a JSON object.',
            },
          },
          {
            name: 'wrapInSuspense',
            type: 'checkbox',
            defaultValue: true,
          },
        ],
      },
    ],
  },
  {
    slug: 'fumaTypeTable',
    labels: {
      singular: 'Type Table',
      plural: 'Type Tables',
    },
    fields: [
      {
        name: 'rows',
        type: 'array',
        required: true,
        minRows: 1,
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'type',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            type: 'textarea',
          },
          {
            name: 'typeDescription',
            type: 'textarea',
          },
          {
            name: 'typeDescriptionLink',
            type: 'text',
          },
          {
            name: 'default',
            type: 'text',
          },
          {
            name: 'required',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            name: 'deprecated',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            name: 'parameters',
            type: 'array',
            fields: [
              {
                name: 'name',
                type: 'text',
                required: true,
              },
              {
                name: 'description',
                type: 'textarea',
              },
            ],
          },
          {
            name: 'returns',
            type: 'textarea',
          },
        ],
      },
    ],
  },
  {
    slug: 'fumaInlineToc',
    labels: {
      singular: 'Inline TOC',
      plural: 'Inline TOCs',
    },
    fields: [
      {
        name: 'label',
        type: 'text',
        admin: {
          description: 'Optional label content rendered inside the TOC trigger.',
        },
      },
      {
        name: 'props',
        type: 'json',
        admin: {
          description: 'Additional InlineTOC props as a JSON object.',
        },
      },
    ],
  },
  {
    slug: 'fumaGithubInfo',
    labels: {
      singular: 'GitHub Info',
      plural: 'GitHub Info',
    },
    fields: [
      {
        name: 'owner',
        type: 'text',
        required: true,
      },
      {
        name: 'repo',
        type: 'text',
        required: true,
      },
      {
        name: 'label',
        type: 'text',
      },
      {
        name: 'token',
        type: 'text',
        admin: {
          description: 'Optional GitHub API token for private/limited API usage.',
        },
      },
      {
        name: 'baseUrl',
        type: 'text',
        admin: {
          description: 'Optional GitHub API base URL override.',
        },
      },
      {
        name: 'props',
        type: 'json',
        admin: {
          description: 'Additional GithubInfo anchor props as a JSON object.',
        },
      },
    ],
  },
  {
    slug: 'fumaImageZoom',
    labels: {
      singular: 'Image Zoom',
      plural: 'Image Zoom',
    },
    fields: [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        required: true,
      },
      {
        name: 'width',
        type: 'number',
        min: 1,
        admin: {
          description: 'Optional render width in pixels.',
        },
      },
      {
        name: 'height',
        type: 'number',
        min: 1,
        admin: {
          description: 'Optional render height in pixels.',
        },
      },
      {
        name: 'alt',
        type: 'text',
      },
      {
        name: 'sizes',
        type: 'text',
        admin: {
          description: 'Optional responsive image sizes attribute.',
        },
      },
      {
        name: 'priority',
        type: 'checkbox',
        defaultValue: false,
      },
      {
        name: 'zoomInProps',
        type: 'json',
        admin: {
          description: 'ImageZoom zoomInProps as a JSON object.',
        },
      },
      {
        name: 'rmiz',
        type: 'json',
        admin: {
          description: 'ImageZoom rmiz props as a JSON object.',
        },
      },
      {
        name: 'props',
        type: 'json',
        admin: {
          description: 'Additional ImageZoom image props as a JSON object.',
        },
      },
      {
        name: 'caption',
        type: 'text',
      },
    ],
  },
]
