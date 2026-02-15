import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { loadRootEnv, readBooleanEnv, readEnv } from '@repo/env'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Services } from './collections/Services'
import { DocVersions } from './collections/DocVersions'
import { DocPageGroups } from './collections/DocPageGroups'
import { DocPages } from './collections/DocPages'
import { Redirects } from './collections/Redirects'
import { DocsSettings } from './globals/DocsSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

loadRootEnv()

const s3Bucket = readEnv('S3_BUCKET')
const s3Region = readEnv('S3_REGION')
const s3AccessKeyId = readEnv('S3_ACCESS_KEY_ID')
const s3SecretAccessKey = readEnv('S3_SECRET_ACCESS_KEY')

if (!s3Bucket || !s3Region || !s3AccessKeyId || !s3SecretAccessKey) {
  throw new Error(
    'Missing S3 configuration. Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.',
  )
}

const s3Endpoint = readEnv('S3_ENDPOINT')
const s3ForcePathStyle = readBooleanEnv('S3_FORCE_PATH_STYLE')

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Services, DocVersions, DocPageGroups, DocPages, Redirects],
  globals: [DocsSettings],
  editor: lexicalEditor(),
  secret: readEnv('PAYLOAD_SECRET', { defaultValue: '' }) || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: readEnv('DATABASE_URL', { defaultValue: '' }) || '',
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: s3Bucket,
      config: {
        credentials: {
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
        },
        region: s3Region,
        ...(s3Endpoint ? { endpoint: s3Endpoint } : {}),
        ...(s3ForcePathStyle ? { forcePathStyle: true } : {}),
      },
    }),
  ],
})
