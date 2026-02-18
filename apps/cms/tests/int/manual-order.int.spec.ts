import { describe, expect, it } from 'vitest'

import {
  dedupePublishedDocVersionNavSlugs,
  flattenDocVersionNavRows,
  normalizeDocVersionNavItems,
  promoteAndPruneGroupFromDocVersionNavItems,
} from '../../src/utils/versionNav'

describe('doc version nav utilities', () => {
  it('auto-demotes duplicate published slugs', () => {
    const navItems = normalizeDocVersionNavItems([
      { blockType: 'pageItem', page: 1, published: true },
      { blockType: 'pageItem', page: 2, published: true },
    ])

    const deduped = dedupePublishedDocVersionNavSlugs(
      navItems,
      new Map([
        ['1', 'intro'],
        ['2', 'intro'],
      ]),
    )

    const rows = flattenDocVersionNavRows(deduped.items)
    expect(rows[0]?.published).toBe(true)
    expect(rows[1]?.published).toBe(false)
    expect(deduped.warnings).toHaveLength(1)
  })

  it('promotes grouped pages to root when pruning a group', () => {
    const navItems = normalizeDocVersionNavItems([
      {
        blockType: 'groupItem',
        group: 10,
        pages: [
          { page: 1, published: true },
          { page: 2, published: false },
        ],
      },
    ])

    const promoted = promoteAndPruneGroupFromDocVersionNavItems(navItems, 10)
    const rows = flattenDocVersionNavRows(promoted)

    expect(promoted.map((item) => item.blockType)).toEqual(['pageItem', 'pageItem'])
    expect(rows.map((row) => row.pageId)).toEqual([1, 2])
    expect(rows.map((row) => row.groupId)).toEqual([null, null])
  })
})
