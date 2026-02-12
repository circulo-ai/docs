import {
  BlocksFeature,
  BlockquoteFeature,
  BoldFeature,
  CodeBlock,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { Field } from 'payload'

import { ElementClipboardFeature } from '../features/elementClipboard/server'
import { fumadocsBlocks } from './fumadocsBlocks'

const DEFAULT_HEADING_LEVELS = ['h2', 'h3', 'h4'] as const

const getFieldName = (field: Field): string | undefined => {
  if ('name' in field && typeof field.name === 'string') {
    return field.name
  }
  return undefined
}

const withExtraCodeBlockFields = (fields: NonNullable<ReturnType<typeof CodeBlock>['fields']>) => {
  const names = new Set(fields.map(getFieldName).filter((name): name is string => Boolean(name)))
  const nextFields = [...fields]
  const pushIfMissing = (field: (typeof nextFields)[number]) => {
    const name = getFieldName(field)
    if (name && names.has(name)) {
      return
    }
    if (name) {
      names.add(name)
    }
    nextFields.push(field)
  }

  pushIfMissing({
    name: 'title',
    type: 'text',
    admin: {
      description: 'Optional code block title passed to DynamicCodeBlock codeblock.title.',
    },
  })
  pushIfMissing({
    name: 'codeblock',
    type: 'json',
    admin: {
      description: 'Additional DynamicCodeBlock codeblock props as JSON.',
    },
  })
  pushIfMissing({
    name: 'options',
    type: 'json',
    admin: {
      description: 'DynamicCodeBlock shiki options as JSON.',
    },
  })
  pushIfMissing({
    name: 'wrapInSuspense',
    type: 'checkbox',
    defaultValue: true,
  })

  return nextFields
}

export const docsCodeBlock = (() => {
  const block = CodeBlock()
  const fields = withExtraCodeBlockFields(Array.isArray(block.fields) ? block.fields : [])
  return {
    ...block,
    fields,
  }
})()

export const docsLexicalEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: [...DEFAULT_HEADING_LEVELS] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    InlineCodeFeature(),
    LinkFeature(),
    OrderedListFeature(),
    UnorderedListFeature(),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    IndentFeature(),
    UploadFeature({
      enabledCollections: ['media'],
      collections: {
        media: {
          fields: [
            {
              name: 'width',
              type: 'number',
              min: 1,
              admin: {
                description: 'Optional render width in pixels for this insertion.',
              },
            },
            {
              name: 'height',
              type: 'number',
              min: 1,
              admin: {
                description: 'Optional render height in pixels for this insertion.',
              },
            },
          ],
        },
      },
    }),
    BlocksFeature({
      blocks: [docsCodeBlock, ...fumadocsBlocks],
    }),
    ElementClipboardFeature(),
    InlineToolbarFeature(),
    FixedToolbarFeature(),
  ],
})
