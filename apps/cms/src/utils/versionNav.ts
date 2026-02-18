type RelationValue = number | string | { id?: number | string } | null | undefined

type JsonRecord = Record<string, unknown>

const asRecord = (value: unknown): JsonRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as JsonRecord
}

const asArray = (value: unknown) => (Array.isArray(value) ? value : [])

export const getRelationId = (value: RelationValue | unknown) => {
  if (!value) return null
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: number | string }).id
    if (id !== undefined) return id
  }
  return null
}

export const sameId = (a: number | string | null, b: number | string | null) =>
  a !== null && b !== null && String(a) === String(b)

const normalizeBlockType = (value: unknown): 'pageItem' | 'groupItem' | null => {
  if (typeof value !== 'string') return null

  const lowered = value.toLowerCase()
  if (lowered === 'page' || lowered === 'pageitem') return 'pageItem'
  if (lowered === 'group' || lowered === 'groupitem') return 'groupItem'
  return null
}

const normalizePublished = (value: unknown) => value !== false

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const normalizeOptionalId = (value: unknown) => {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return undefined
}

const normalizePageRow = (value: unknown): DocVersionNavPageRow | null => {
  const record = asRecord(value)
  if (!record) return null

  return {
    id: normalizeOptionalId(record.id),
    page: record.page,
    published: normalizePublished(record.published),
  }
}

export type DocVersionNavPageRow = {
  id?: string
  page: unknown
  published: boolean
}

export type DocVersionNavItem =
  | {
      id?: string
      blockType: 'pageItem'
      blockName?: string
      page: unknown
      published: boolean
    }
  | {
      id?: string
      blockType: 'groupItem'
      blockName?: string
      group: unknown
      pages: DocVersionNavPageRow[]
    }

export type FlattenedDocVersionNavRow = {
  pageId: number | string
  published: boolean
  groupId: number | string | null
  rootIndex: number
  pageIndex: number | null
}

export const normalizeDocVersionNavItems = (value: unknown): DocVersionNavItem[] => {
  const normalized: DocVersionNavItem[] = []

  for (const candidate of asArray(value)) {
    const record = asRecord(candidate)
    if (!record) continue

    const blockType = normalizeBlockType(record.blockType ?? record.kind ?? record.type)
    if (blockType === 'pageItem') {
      const item: Extract<DocVersionNavItem, { blockType: 'pageItem' }> = {
        id: normalizeOptionalId(record.id),
        blockType: 'pageItem',
        page: record.page,
        published: normalizePublished(record.published),
      }
      const blockName = normalizeOptionalString(record.blockName)
      if (blockName) item.blockName = blockName

      normalized.push(item)
      continue
    }

    if (blockType === 'groupItem') {
      const pages = asArray(record.pages)
        .map((entry) => normalizePageRow(entry))
        .filter((entry): entry is DocVersionNavPageRow => Boolean(entry))

      const item: Extract<DocVersionNavItem, { blockType: 'groupItem' }> = {
        id: normalizeOptionalId(record.id),
        blockType: 'groupItem',
        group: record.group,
        pages,
      }
      const blockName = normalizeOptionalString(record.blockName)
      if (blockName) item.blockName = blockName

      normalized.push(item)
    }
  }

  return normalized
}

export const flattenDocVersionNavRows = (
  items: DocVersionNavItem[],
): FlattenedDocVersionNavRow[] => {
  const rows: FlattenedDocVersionNavRow[] = []

  items.forEach((item, rootIndex) => {
    if (item.blockType === 'pageItem') {
      const pageId = getRelationId(item.page)
      if (pageId === null) return
      rows.push({
        pageId,
        published: item.published,
        groupId: null,
        rootIndex,
        pageIndex: null,
      })
      return
    }

    const groupId = getRelationId(item.group)
    item.pages.forEach((row, pageIndex) => {
      const pageId = getRelationId(row.page)
      if (pageId === null) return
      rows.push({
        pageId,
        published: row.published,
        groupId,
        rootIndex,
        pageIndex,
      })
    })
  })

  return rows
}

export const collectDocVersionNavPageIds = (items: DocVersionNavItem[]) => {
  const ids = new Map<string, number | string>()

  flattenDocVersionNavRows(items).forEach((row) => {
    ids.set(String(row.pageId), row.pageId)
  })

  return Array.from(ids.values())
}

export const collectDocVersionNavGroupIds = (items: DocVersionNavItem[]) => {
  const ids = new Map<string, number | string>()

  items.forEach((item) => {
    if (item.blockType !== 'groupItem') return
    const groupId = getRelationId(item.group)
    if (groupId === null) return
    ids.set(String(groupId), groupId)
  })

  return Array.from(ids.values())
}

export const hasPublishedDocVersionNavRows = (items: DocVersionNavItem[]) =>
  flattenDocVersionNavRows(items).some((row) => row.published)

const setFlattenedRowPublished = (
  items: DocVersionNavItem[],
  row: Pick<FlattenedDocVersionNavRow, 'rootIndex' | 'pageIndex'>,
  published: boolean,
) => {
  const target = items[row.rootIndex]
  if (!target) return

  if (target.blockType === 'pageItem') {
    target.published = published
    return
  }

  if (row.pageIndex === null) return
  const targetRow = target.pages[row.pageIndex]
  if (!targetRow) return
  targetRow.published = published
}

export const dedupePublishedDocVersionNavSlugs = (
  items: DocVersionNavItem[],
  pageSlugById: Map<string, string>,
) => {
  const nextItems = normalizeDocVersionNavItems(items)
  const seen = new Set<string>()
  const warnings: string[] = []

  flattenDocVersionNavRows(nextItems).forEach((row) => {
    if (!row.published) return

    const slug = pageSlugById.get(String(row.pageId))
    if (!slug) return

    if (!seen.has(slug)) {
      seen.add(slug)
      return
    }

    setFlattenedRowPublished(nextItems, row, false)
    warnings.push(
      `Duplicate published slug "${slug}" was auto-demoted to draft for page ${String(row.pageId)}.`,
    )
  })

  return {
    items: nextItems,
    warnings,
  }
}

export const prunePageFromDocVersionNavItems = (
  items: DocVersionNavItem[],
  pageId: number | string,
) => {
  const target = String(pageId)
  const next = normalizeDocVersionNavItems(items)
    .map((item): DocVersionNavItem | null => {
      if (item.blockType === 'pageItem') {
        const id = getRelationId(item.page)
        if (id !== null && String(id) === target) return null
        return item
      }

      return {
        ...item,
        pages: item.pages.filter((row) => {
          const id = getRelationId(row.page)
          if (id === null) return false
          return String(id) !== target
        }),
      }
    })
    .filter((item): item is DocVersionNavItem => Boolean(item))

  return next
}

export const promoteAndPruneGroupFromDocVersionNavItems = (
  items: DocVersionNavItem[],
  groupId: number | string,
) => {
  const target = String(groupId)
  const next: DocVersionNavItem[] = []

  normalizeDocVersionNavItems(items).forEach((item) => {
    if (item.blockType !== 'groupItem') {
      next.push(item)
      return
    }

    const id = getRelationId(item.group)
    if (id === null || String(id) !== target) {
      next.push(item)
      return
    }

    item.pages.forEach((row) => {
      next.push({
        blockType: 'pageItem',
        page: row.page,
        published: row.published,
      })
    })
  })

  return next
}

export const findPublishedPageIdsBySlugInDocVersionNav = (
  items: DocVersionNavItem[],
  pageSlugById: Map<string, string>,
  slug: string,
) =>
  flattenDocVersionNavRows(items)
    .filter((row) => row.published)
    .filter((row) => pageSlugById.get(String(row.pageId)) === slug)
    .map((row) => row.pageId)
