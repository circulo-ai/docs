import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { syncLatestVersionForService } from '../../src/utils/latestVersion'

const createReq = () => {
  const find = vi.fn()
  const findByID = vi.fn()
  const update = vi.fn()
  const error = vi.fn()

  return {
    req: {
      payload: {
        find,
        findByID,
        update,
        logger: {
          error,
        },
      },
    },
    find,
    findByID,
    update,
  }
}

describe('latest version sync', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = {
      ...originalEnv,
      DOCS_REVALIDATE_URL: 'http://docs.local/api/revalidate/latest-version',
      DOCS_REVALIDATE_SECRET: 'docs-revalidate-secret',
    }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it('updates and revalidates when latest version changes', async () => {
    const { req, find, findByID, update } = createReq()
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    findByID.mockResolvedValue({
      id: 1,
      slug: 'ciruclo',
      latestVersion: 10,
    })
    find.mockResolvedValue({
      docs: [{ id: 11 }],
    })

    await syncLatestVersionForService(req as never, 1)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'services',
        id: 1,
        data: {
          latestVersion: 11,
        },
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      'http://docs.local/api/revalidate/latest-version',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          service: 'ciruclo',
        }),
      }),
    )
  })

  it('skips update and revalidation when latest version is unchanged', async () => {
    const { req, find, findByID, update } = createReq()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    findByID.mockResolvedValue({
      id: 1,
      slug: 'ciruclo',
      latestVersion: 11,
    })
    find.mockResolvedValue({
      docs: [{ id: 11 }],
    })

    await syncLatestVersionForService(req as never, 1)

    expect(update).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
