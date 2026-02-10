import { ValidationError } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  enforcePageDeleteIntegrity,
  enforcePageServiceMatchesVersion,
  enforcePublishedPageState,
  resolveVersionStatusFromPages,
  syncVersionStatus,
} from '../../src/access/publish'

const collectionDocPages = { slug: 'docPages' } as never
const context = {} as never

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

describe('publish state guards', () => {
  it('derives draft status when a version has no published pages', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({ totalDocs: 0 })

    await expect(resolveVersionStatusFromPages(req as never, 9)).resolves.toBe('draft')
  })

  it('derives published status when a version has at least one published page', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({ totalDocs: 1 })

    await expect(resolveVersionStatusFromPages(req as never, 9)).resolves.toBe('published')
  })

  it('syncs version status to published when any published page exists', async () => {
    const { req, find, findByID, update } = createReq()
    findByID.mockResolvedValueOnce({
      id: 9,
      status: 'draft',
    })
    find.mockResolvedValueOnce({ totalDocs: 1 })
    update.mockResolvedValueOnce({})

    await syncVersionStatus(req as never, 9)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'docVersions',
        id: 9,
        data: {
          status: 'published',
        },
      }),
    )
  })

  it('blocks saving a page when selected service does not match version service', async () => {
    const { req, findByID } = createReq()
    findByID.mockResolvedValueOnce({
      id: 11,
      service: 7,
      status: 'published',
      defaultPageSlug: 'intro',
    })

    await expect(
      enforcePageServiceMatchesVersion({
        collection: collectionDocPages,
        context,
        operation: 'create',
        data: {
          service: 8,
          version: 11,
          status: 'draft',
        },
        originalDoc: null as never,
        req: req as never,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('allows unpublishing the last published page of a version', async () => {
    const { req, findByID } = createReq()
    findByID.mockResolvedValueOnce({
      id: 22,
      service: 5,
      status: 'published',
      defaultPageSlug: 'intro',
    })

    await expect(
      enforcePublishedPageState({
        collection: collectionDocPages,
        context,
        operation: 'update',
        data: {
          status: 'draft',
        },
        originalDoc: {
          id: 101,
          service: 5,
          version: 22,
          slug: 'guide',
          status: 'published',
        },
        req: req as never,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'draft',
      }),
    )
  })

  it('blocks deleting the default page of a published version', async () => {
    const { req, findByID } = createReq()
    findByID.mockResolvedValueOnce({
      id: 101,
      service: 5,
      version: 22,
      slug: 'intro',
      status: 'published',
    })
    findByID.mockResolvedValueOnce({
      id: 22,
      service: 5,
      status: 'published',
      defaultPageSlug: 'intro',
    })

    await expect(
      enforcePageDeleteIntegrity({
        collection: collectionDocPages,
        context,
        id: 101,
        req: req as never,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })
})
