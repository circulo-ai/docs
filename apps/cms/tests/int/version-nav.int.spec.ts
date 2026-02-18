import { ValidationError } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  enforceDefaultPageSlugMatchesPublishedNav,
  enforceNavItemsIntegrity,
} from '../../src/collections/DocVersions'

const createReq = () => {
  const find = vi.fn()

  return {
    req: {
      payload: {
        find,
      },
      user: {
        id: 1,
        roles: ['admin'],
      },
    },
    find,
  }
}

describe('doc versions nav validation', () => {
  it('rejects page references from another service', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({
      docs: [{ id: 2, service: 99, slug: 'intro' }],
      totalDocs: 1,
    })
    find.mockResolvedValueOnce({
      docs: [],
      totalDocs: 0,
    })

    await expect(
      enforceNavItemsIntegrity({
        collection: { slug: 'docVersions' } as never,
        context: {} as never,
        operation: 'create',
        data: {
          service: 1,
          navItems: [{ blockType: 'pageItem', page: 2, published: true }],
        },
        originalDoc: null as never,
        req: req as never,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects group references from another service', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({
      docs: [{ id: 7, service: 99, slug: 'getting-started' }],
      totalDocs: 1,
    })

    await expect(
      enforceNavItemsIntegrity({
        collection: { slug: 'docVersions' } as never,
        context: {} as never,
        operation: 'create',
        data: {
          service: 1,
          navItems: [{ blockType: 'groupItem', group: 7, pages: [] }],
        },
        originalDoc: null as never,
        req: req as never,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('auto-demotes duplicate published slugs and stores warnings', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({
      docs: [
        { id: 1, service: 1, slug: 'intro' },
        { id: 2, service: 1, slug: 'intro' },
      ],
      totalDocs: 2,
    })
    find.mockResolvedValueOnce({
      docs: [],
      totalDocs: 0,
    })

    const result = await enforceNavItemsIntegrity({
      collection: { slug: 'docVersions' } as never,
      context: {} as never,
      operation: 'create',
      data: {
        service: 1,
        navItems: [
          { blockType: 'pageItem', page: 1, published: true },
          { blockType: 'pageItem', page: 2, published: true },
        ],
      },
      originalDoc: null as never,
      req: req as never,
    })

    const rows = (result as { navItems: Array<{ published?: boolean }> }).navItems
    expect(rows[0]?.published).toBe(true)
    expect(rows[1]?.published).toBe(false)
    expect((result as { navWarnings?: string }).navWarnings).toContain(
      'Duplicate published slug "intro"',
    )
  })

  it('accepts duplicate slugs when only one row is published', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({
      docs: [
        { id: 1, service: 1, slug: 'intro' },
        { id: 2, service: 1, slug: 'intro' },
      ],
      totalDocs: 2,
    })
    find.mockResolvedValueOnce({
      docs: [],
      totalDocs: 0,
    })

    const result = await enforceNavItemsIntegrity({
      collection: { slug: 'docVersions' } as never,
      context: {} as never,
      operation: 'create',
      data: {
        service: 1,
        navItems: [
          { blockType: 'pageItem', page: 1, published: true },
          { blockType: 'pageItem', page: 2, published: false },
        ],
      },
      originalDoc: null as never,
      req: req as never,
    })

    const rows = (result as { navItems: Array<{ published?: boolean }> }).navItems
    expect(rows[0]?.published).toBe(true)
    expect(rows[1]?.published).toBe(false)
    expect((result as { navWarnings?: string | null }).navWarnings).toBeNull()
  })

  it('requires published versions to use a selected published default slug', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({
      docs: [{ id: 1, slug: 'guide' }],
      totalDocs: 1,
    })

    await expect(
      enforceDefaultPageSlugMatchesPublishedNav({
        collection: { slug: 'docVersions' } as never,
        context: {} as never,
        operation: 'update',
        data: {
          status: 'published',
          defaultPageSlug: 'intro',
          navItems: [{ blockType: 'pageItem', page: 1, published: true }],
        },
        originalDoc: {
          service: 1,
          status: 'draft',
          defaultPageSlug: 'intro',
        } as never,
        req: req as never,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })
})
