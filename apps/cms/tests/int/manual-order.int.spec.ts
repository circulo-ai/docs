import { ValidationError } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { enforceUniqueManualDocPageOrder } from '../../src/collections/DocPages'
import { enforceUniqueManualDocPageGroupOrder } from '../../src/collections/DocPageGroups'

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

describe('manual order guards', () => {
  it('blocks duplicate manual page order in ungrouped scope', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({
      docs: [{ id: 99 }],
      totalDocs: 1,
    })

    await expect(
      enforceUniqueManualDocPageOrder({
        collection: { slug: 'docPages' } as never,
        context: {} as never,
        operation: 'create',
        data: {
          service: 1,
          version: 10,
          group: null,
          orderMode: 'manual',
          order: 3,
        },
        originalDoc: null as never,
        req: req as never,
      }),
    ).rejects.toBeInstanceOf(ValidationError)

    const where = find.mock.calls[0]?.[0]?.where as { and?: unknown[] } | undefined
    expect(where?.and).toContainEqual({
      group: {
        exists: false,
      },
    })
  })

  it('does not query duplicate page order when manual scope is unchanged on update', async () => {
    const { req, find } = createReq()

    await expect(
      enforceUniqueManualDocPageOrder({
        collection: { slug: 'docPages' } as never,
        context: {} as never,
        operation: 'update',
        data: {
          title: 'Updated title only',
        },
        originalDoc: {
          id: 7,
          service: 1,
          version: 10,
          group: null,
          orderMode: 'manual',
          order: 3,
        } as never,
        req: req as never,
      }),
    ).resolves.toEqual({
      title: 'Updated title only',
    })

    expect(find).not.toHaveBeenCalled()
  })

  it('allows same manual page order across different groups', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({
      docs: [],
      totalDocs: 0,
    })

    await expect(
      enforceUniqueManualDocPageOrder({
        collection: { slug: 'docPages' } as never,
        context: {} as never,
        operation: 'create',
        data: {
          service: 1,
          version: 10,
          group: 22,
          orderMode: 'manual',
          order: 3,
        },
        originalDoc: null as never,
        req: req as never,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        service: 1,
        version: 10,
      }),
    )
  })

  it('blocks duplicate manual group order in the same service/version', async () => {
    const { req, find } = createReq()
    find.mockResolvedValueOnce({
      docs: [{ id: 55 }],
      totalDocs: 1,
    })

    await expect(
      enforceUniqueManualDocPageGroupOrder({
        collection: { slug: 'docPageGroups' } as never,
        context: {} as never,
        operation: 'create',
        data: {
          service: 1,
          version: 10,
          orderMode: 'manual',
          order: 2,
        },
        originalDoc: null as never,
        req: req as never,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })
})
