import { ValidationError } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import {
  enforcePageDeleteIntegrity,
  enforcePageServiceMatchesVersion,
  enforcePublishedPageState,
  enforceVersionStateIntegrity,
} from '../../src/access/publish'

const collectionDocVersions = { slug: 'docVersions' } as never
const collectionDocPages = { slug: 'docPages' } as never
const context = {} as never

const createReq = () => {
  const find = vi.fn()
  const findByID = vi.fn()

  return {
    req: {
      payload: {
        find,
        findByID,
      },
      user: {
        id: 1,
        roles: ['admin'],
      },
    },
    find,
    findByID,
  }
}

describe('publish state guards', () => {
  it('blocks publishing a version with no pages', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({ totalDocs: 0 })

    await expect(
      enforceVersionStateIntegrity({
        collection: collectionDocVersions,
        context,
        operation: 'update',
        data: {
          status: 'published',
          service: 42,
          defaultPageSlug: 'getting-started',
        },
        originalDoc: {
          id: 9,
          status: 'draft',
          service: 42,
          defaultPageSlug: 'getting-started',
        },
        req: req as never,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('blocks setting a version to draft when published pages still exist', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({ totalDocs: 1 })

    await expect(
      enforceVersionStateIntegrity({
        collection: collectionDocVersions,
        context,
        operation: 'update',
        data: {
          status: 'draft',
          service: 42,
        },
        originalDoc: {
          id: 9,
          status: 'published',
          service: 42,
          defaultPageSlug: 'getting-started',
        },
        req: req as never,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
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

  it('blocks unpublishing the last published page of a published version', async () => {
    const { req, find, findByID } = createReq()
    findByID.mockResolvedValueOnce({
      id: 22,
      service: 5,
      status: 'published',
      defaultPageSlug: 'intro',
    })
    find.mockResolvedValueOnce({ totalDocs: 0 })

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
    ).rejects.toBeInstanceOf(ValidationError)
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
