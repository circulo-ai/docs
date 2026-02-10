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

import { ElementClipboardFeature } from '../features/elementClipboard/server'
import { fumadocsBlocks } from './fumadocsBlocks'

const DEFAULT_HEADING_LEVELS = ['h2', 'h3', 'h4'] as const

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
    UploadFeature({ enabledCollections: ['media'] }),
    BlocksFeature({
      blocks: [CodeBlock(), ...fumadocsBlocks],
    }),
    ElementClipboardFeature(),
    InlineToolbarFeature(),
    FixedToolbarFeature(),
  ],
})
