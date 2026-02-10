import type { Block } from 'payload'

export const fumadocsBlocks: Block[] = [
  {
    slug: 'fumaBanner',
    labels: {
      singular: 'Banner',
      plural: 'Banners',
    },
    fields: [
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
        name: 'changeLayout',
        type: 'checkbox',
        defaultValue: false,
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
          {
            name: 'href',
            type: 'text',
          },
          {
            name: 'external',
            type: 'checkbox',
            defaultValue: false,
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
            name: 'content',
            type: 'textarea',
            required: true,
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
            name: 'language',
            type: 'text',
            required: true,
          },
          {
            name: 'code',
            type: 'code',
            required: true,
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
    fields: [],
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
        name: 'alt',
        type: 'text',
      },
      {
        name: 'caption',
        type: 'text',
      },
    ],
  },
]
