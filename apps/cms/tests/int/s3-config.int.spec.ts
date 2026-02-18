import { describe, expect, it } from 'vitest'

import { getMissingS3ConfigKeys, readS3Config } from '../../src/utils/s3Config'

describe('s3 config parsing', () => {
  it('returns parsed config when all required env vars exist', () => {
    const env = {
      S3_BUCKET: 'docs-media',
      S3_REGION: 'us-east-1',
      S3_ACCESS_KEY_ID: 'access-key',
      S3_SECRET_ACCESS_KEY: 'secret-key',
      S3_ENDPOINT: 'http://minio:9000',
      S3_FORCE_PATH_STYLE: 'true',
    }

    expect(readS3Config(env)).toEqual({
      bucket: 'docs-media',
      region: 'us-east-1',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      endpoint: 'http://minio:9000',
      forcePathStyle: true,
    })
    expect(getMissingS3ConfigKeys(env)).toEqual([])
  })

  it('returns null when required vars are missing and reports missing keys', () => {
    const env = {
      S3_BUCKET: 'docs-media',
      S3_REGION: 'us-east-1',
      S3_ACCESS_KEY_ID: '',
      S3_SECRET_ACCESS_KEY: undefined,
    }

    expect(readS3Config(env)).toBeNull()
    expect(getMissingS3ConfigKeys(env)).toEqual(['S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'])
  })
})
