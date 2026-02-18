import { ValidationError } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  enforcePublishPermissions,
  enforcePageDeleteIntegrity,
  enforcePageUpdateIntegrity,
  pruneDeletedGroupFromVersions,
  pruneDeletedPageFromVersions,
  resolveVersionStatusFromNavItems,
} from '../../src/access/publish'

const createReq = () => {
  const find = vi.fn()
  const findByID = vi.fn()
  const update = vi.fn()

  return {
    req: {
      payload: {
        find,
        findByID,
        update,
      },
      user: {
        id: 1,
        roles: ['admin'],
      },
    },
    find,
    findByID,
    update,
  }
}

describe('publish guards for version-owned nav', () => {
  it('derives draft status when there are no published nav rows', () => {
    expect(
      resolveVersionStatusFromNavItems([{ blockType: 'pageItem', page: 1, published: false }]),
    ).toBe('draft')
  })

  it('derives published status when any nav row is published', () => {
    expect(
      resolveVersionStatusFromNavItems([
        { blockType: 'pageItem', page: 1, published: false },
        { blockType: 'pageItem', page: 2, published: true },
      ]),
    ).toBe('published')
  })

  it('blocks deleting the default page of a published version', async () => {
    const { req, find, findByID } = createReq()
    findByID.mockResolvedValueOnce({
      id: 101,
      service: 5,
      slug: 'intro',
    })
    find.mockResolvedValueOnce({
      docs: [
        {
          id: 22,
          service: 5,
          status: 'published',
          defaultPageSlug: 'intro',
          navItems: [{ blockType: 'pageItem', page: 101, published: true }],
        },
      ],
      totalDocs: 1,
      hasNextPage: false,
      nextPage: null,
    })

    await expect(
      enforcePageDeleteIntegrity({
        collection: { slug: 'docPages' } as never,
        context: {} as never,
        id: 101,
        req: req as never,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('blocks changing slug for a page that is published default in a version', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({
      docs: [
        {
          id: 22,
          service: 5,
          status: 'published',
          defaultPageSlug: 'intro',
          navItems: [{ blockType: 'pageItem', page: 101, published: true }],
        },
      ],
      totalDocs: 1,
      hasNextPage: false,
      nextPage: null,
    })

    await expect(
      enforcePageUpdateIntegrity({
        collection: { slug: 'docPages' } as never,
        context: {} as never,
        operation: 'update',
        data: {
          slug: 'new-intro',
        },
        originalDoc: {
          id: 101,
          service: 5,
          slug: 'intro',
        } as never,
        req: req as never,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('promotes grouped rows to root when a group is deleted', async () => {
    const { req, find, update } = createReq()
    find.mockResolvedValueOnce({
      docs: [
        {
          id: 22,
          service: 5,
          status: 'draft',
          navItems: [
            {
              blockType: 'groupItem',
              group: 77,
              pages: [{ page: 101, published: true }],
            },
          ],
        },
      ],
      totalDocs: 1,
      hasNextPage: false,
      nextPage: null,
    })
    find.mockResolvedValueOnce({
      docs: [{ id: 101, slug: 'intro' }],
      totalDocs: 1,
      hasNextPage: false,
      nextPage: null,
    })
    update.mockResolvedValue({})

    await pruneDeletedGroupFromVersions({
      collection: { slug: 'docPageGroups' } as never,
      context: {} as never,
      doc: {
        id: 77,
        service: 5,
      } as never,
      id: 77 as never,
      req: req as never,
    })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'docVersions',
        id: 22,
        data: expect.objectContaining({
          navItems: [{ blockType: 'pageItem', page: 101, published: true }],
          status: 'published',
        }),
      }),
    )
  })

  it('prunes deleted page references and re-syncs version status', async () => {
    const { req, find, update } = createReq()
    find.mockResolvedValueOnce({
      docs: [
        {
          id: 22,
          service: 5,
          status: 'published',
          navItems: [{ blockType: 'pageItem', page: 101, published: true }],
        },
      ],
      totalDocs: 1,
      hasNextPage: false,
      nextPage: null,
    })
    update.mockResolvedValue({})

    await pruneDeletedPageFromVersions({
      collection: { slug: 'docPages' } as never,
      context: {} as never,
      doc: {
        id: 101,
        service: 5,
      } as never,
      id: 101 as never,
      req: req as never,
    })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'docVersions',
        id: 22,
        data: expect.objectContaining({
          navItems: [],
          status: 'draft',
        }),
      }),
    )
  })

  it('prevents writers from publishing nav rows', async () => {
    const hook = enforcePublishPermissions('Doc version')

    expect(() =>
      hook({
        collection: { slug: 'docVersions' } as never,
        context: {} as never,
        operation: 'update',
        data: {
          status: 'published',
          navItems: [{ blockType: 'pageItem', page: 101, published: true }],
        },
        originalDoc: {
          status: 'draft',
          navItems: [{ blockType: 'pageItem', page: 101, published: false }],
        } as never,
        req: {
          user: {
            id: 2,
            roles: ['writer'],
          },
        } as never,
      }),
    ).toThrow(ValidationError)
  })

  it('allows writers to edit structure when published rows are unchanged', async () => {
    const hook = enforcePublishPermissions('Doc version')

    const result = hook({
      collection: { slug: 'docVersions' } as never,
      context: {} as never,
      operation: 'update',
      data: {
        status: 'published',
        navItems: [
          { blockType: 'pageItem', page: 101, published: true },
          { blockType: 'pageItem', page: 202, published: false },
        ],
      },
      originalDoc: {
        status: 'published',
        navItems: [
          { blockType: 'pageItem', page: 101, published: true },
          { blockType: 'groupItem', group: 77, pages: [{ page: 201, published: false }] },
        ],
      } as never,
      req: {
        user: {
          id: 2,
          roles: ['writer'],
        },
      } as never,
    })

    expect(result).toEqual(
      expect.objectContaining({
        navItems: expect.any(Array),
      }),
    )
  })
})
