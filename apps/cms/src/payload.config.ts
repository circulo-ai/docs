import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { loadRootEnv, readEnv } from '@repo/env'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Services } from './collections/Services'
import { ServiceThemes } from './collections/ServiceThemes'
import { DocVersions } from './collections/DocVersions'
import { DocPageGroups } from './collections/DocPageGroups'
import { DocPages } from './collections/DocPages'
import { Redirects } from './collections/Redirects'
import { DocsSettings } from './globals/DocsSettings'
import { getMissingS3ConfigKeys, readS3Config } from './utils/s3Config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

loadRootEnv()

const s3Config = readS3Config()
if (!s3Config) {
  const missing = getMissingS3ConfigKeys().join(', ')
  console.warn(
    `[payload] S3 storage disabled because these env vars are missing: ${missing}. Media uploads will use local filesystem storage.`,
  )
}

const buildPoolConfig = () => {
  const host = readEnv('PGHOST')
  const user = readEnv('PGUSER')
  const database = readEnv('PGDATABASE')
  const password = readEnv('PGPASSWORD')
  const portValue = readEnv('PGPORT')
  const parsedPort = portValue ? Number.parseInt(portValue, 10) : undefined

  if (host && user && database) {
    return {
      host,
      user,
      database,
      ...(password ? { password } : {}),
      ...(parsedPort && Number.isInteger(parsedPort) ? { port: parsedPort } : {}),
    }
  }

  return {
    connectionString: readEnv('DATABASE_URL', { defaultValue: '' }) || '',
  }
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    ServiceThemes,
    Services,
    DocVersions,
    DocPageGroups,
    DocPages,
    Redirects,
  ],
  globals: [DocsSettings],
  editor: lexicalEditor(),
  secret: readEnv('PAYLOAD_SECRET', { defaultValue: '' }) || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: buildPoolConfig(),
  }),
  sharp,
  plugins: s3Config
    ? [
        s3Storage({
          collections: {
            media: true,
          },
          bucket: s3Config.bucket,
          config: {
            credentials: {
              accessKeyId: s3Config.accessKeyId,
              secretAccessKey: s3Config.secretAccessKey,
            },
            region: s3Config.region,
            ...(s3Config.endpoint ? { endpoint: s3Config.endpoint } : {}),
            ...(s3Config.forcePathStyle ? { forcePathStyle: true } : {}),
          },
        }),
      ]
    : [],
})
