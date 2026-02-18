import type { Block, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { docsCodeBlock } from '../../src/utils/docsEditor'
import { fumadocsBlocks } from '../../src/utils/fumadocsBlocks'

const bySlug = (slug: string): Block => {
  const block = fumadocsBlocks.find((value) => value.slug === slug)
  if (!block) {
    throw new Error(`Missing block: ${slug}`)
  }
  return block
}

const byName = (fields: Field[] | undefined, name: string): Field => {
  const field = fields?.find((value) => 'name' in value && value.name === name)
  if (!field) {
    throw new Error(`Missing field: ${name}`)
  }
  return field
}

const expectFieldType = (field: Field, type: string) => {
  expect(field).toHaveProperty('type', type)
}

const expectSelectOptions = (field: Field, expected: string[]) => {
  if (!('type' in field) || field.type !== 'select') {
    throw new Error('Expected select field')
  }

  const values = (field.options ?? [])
    .map((option) => {
      if (typeof option === 'string') return option
      if (option && typeof option === 'object' && 'value' in option) {
        return typeof option.value === 'string' ? option.value : ''
      }
      return ''
    })
    .filter(Boolean)

  expect(values).toEqual(expected)
}

const arrayFields = (field: Field): Field[] => {
  if (!('type' in field) || field.type !== 'array') {
    throw new Error('Expected array field')
  }
  return field.fields
}

const groupFields = (field: Field): Field[] => {
  if (!('type' in field) || field.type !== 'group') {
    throw new Error('Expected group field')
  }
  return field.fields
}

const expectIconSelectorGroup = (field: Field) => {
  expectFieldType(field, 'group')

  const fields = groupFields(field)
  expectFieldType(byName(fields, 'source'), 'radio')

  const lucide = byName(fields, 'lucide')
  expectFieldType(lucide, 'select')
  expect((lucide as { admin?: { components?: { Field?: string } } }).admin?.components?.Field).toBe(
    './components/IconSelectField',
  )

  const customSvg = byName(fields, 'customSvg')
  expectFieldType(customSvg, 'upload')
  expect((customSvg as { relationTo?: unknown }).relationTo).toBe('media')
}

describe('fumadocs block prop exposure', () => {
  it('exposes banner, callout, cards, accordion, and tabs props', () => {
    const banner = bySlug('fumaBanner')
    expectFieldType(byName(banner.fields, 'id'), 'text')
    expectFieldType(byName(banner.fields, 'rainbowColors'), 'textarea')
    expectFieldType(byName(banner.fields, 'props'), 'json')

    const callout = bySlug('fumaCallout')
    expectIconSelectorGroup(byName(callout.fields, 'icon'))
    expectFieldType(byName(callout.fields, 'props'), 'json')

    const cards = bySlug('fumaCards')
    expectFieldType(byName(cards.fields, 'props'), 'json')
    const cardsArray = arrayFields(byName(cards.fields, 'cards'))
    expectIconSelectorGroup(byName(cardsArray, 'icon'))
    const cardTarget = byName(cardsArray, 'target')
    expectFieldType(cardTarget, 'select')
    expectSelectOptions(cardTarget, ['_self', '_blank', '_parent', '_top'])
    expectFieldType(byName(cardsArray, 'props'), 'json')

    const accordions = bySlug('fumaAccordions')
    expectFieldType(byName(accordions.fields, 'props'), 'json')
    const accordionItems = arrayFields(byName(accordions.fields, 'items'))
    expectFieldType(byName(accordionItems, 'props'), 'json')

    const tabs = bySlug('fumaTabs')
    expectFieldType(byName(tabs.fields, 'props'), 'json')
    const tabItems = arrayFields(byName(tabs.fields, 'tabs'))
    expectFieldType(byName(tabItems, 'props'), 'json')
  })

  it('exposes files, code tabs, type table, auto type table, inline toc, github info, and image zoom props', () => {
    const files = bySlug('fumaFiles')
    expectFieldType(byName(files.fields, 'props'), 'json')
    const entries = arrayFields(byName(files.fields, 'entries'))
    expectFieldType(byName(entries, 'disabled'), 'checkbox')
    expectIconSelectorGroup(byName(entries, 'icon'))
    expectFieldType(byName(entries, 'props'), 'json')

    const children = arrayFields(byName(entries, 'childrenEntries'))
    expectIconSelectorGroup(byName(children, 'icon'))
    expectFieldType(byName(children, 'props'), 'json')

    const codeTabs = bySlug('fumaCodeTabs')
    expectFieldType(byName(codeTabs.fields, 'props'), 'json')
    expectFieldType(byName(codeTabs.fields, 'tabsListProps'), 'json')
    const codeTabsArray = arrayFields(byName(codeTabs.fields, 'tabs'))
    expectFieldType(byName(codeTabsArray, 'value'), 'text')
    expectFieldType(byName(codeTabsArray, 'triggerProps'), 'json')
    expectFieldType(byName(codeTabsArray, 'tabProps'), 'json')
    expectFieldType(byName(codeTabsArray, 'codeblock'), 'json')
    expectFieldType(byName(codeTabsArray, 'options'), 'json')
    expectFieldType(byName(codeTabsArray, 'wrapInSuspense'), 'checkbox')

    const typeTable = bySlug('fumaTypeTable')
    const rows = arrayFields(byName(typeTable.fields, 'rows'))
    expectFieldType(byName(rows, 'typeDescription'), 'textarea')
    expectFieldType(byName(rows, 'typeDescriptionLink'), 'text')
    expectFieldType(byName(rows, 'parameters'), 'array')
    expectFieldType(byName(rows, 'returns'), 'textarea')

    const autoTypeTable = bySlug('fumaAutoTypeTable')
    expectFieldType(byName(autoTypeTable.fields, 'path'), 'text')
    expectFieldType(byName(autoTypeTable.fields, 'name'), 'text')
    expectFieldType(byName(autoTypeTable.fields, 'type'), 'code')
    expectFieldType(byName(autoTypeTable.fields, 'allowInternal'), 'checkbox')
    expectFieldType(byName(autoTypeTable.fields, 'basePath'), 'text')
    expectFieldType(byName(autoTypeTable.fields, 'options'), 'json')
    expectFieldType(byName(autoTypeTable.fields, 'shiki'), 'json')
    expectFieldType(byName(autoTypeTable.fields, 'generatorTsconfigPath'), 'text')
    expectFieldType(byName(autoTypeTable.fields, 'disableGeneratorCache'), 'checkbox')
    expectFieldType(byName(autoTypeTable.fields, 'generatorCacheDir'), 'text')
    expectFieldType(byName(autoTypeTable.fields, 'props'), 'json')

    const toc = bySlug('fumaInlineToc')
    expectFieldType(byName(toc.fields, 'label'), 'text')
    expectFieldType(byName(toc.fields, 'props'), 'json')

    const githubInfo = bySlug('fumaGithubInfo')
    expectFieldType(byName(githubInfo.fields, 'token'), 'text')
    expectFieldType(byName(githubInfo.fields, 'baseUrl'), 'text')
    expectFieldType(byName(githubInfo.fields, 'props'), 'json')

    const imageZoom = bySlug('fumaImageZoom')
    expectFieldType(byName(imageZoom.fields, 'sizes'), 'text')
    expectFieldType(byName(imageZoom.fields, 'priority'), 'checkbox')
    expectFieldType(byName(imageZoom.fields, 'zoomInProps'), 'json')
    expectFieldType(byName(imageZoom.fields, 'rmiz'), 'json')
    expectFieldType(byName(imageZoom.fields, 'props'), 'json')
  })

  it('extends the default Code block with dynamic codeblock prop fields', () => {
    expect(docsCodeBlock.slug).toBe('Code')
    expectFieldType(byName(docsCodeBlock.fields, 'title'), 'text')
    expectFieldType(byName(docsCodeBlock.fields, 'codeblock'), 'json')
    expectFieldType(byName(docsCodeBlock.fields, 'options'), 'json')
    expectFieldType(byName(docsCodeBlock.fields, 'wrapInSuspense'), 'checkbox')
  })
})
