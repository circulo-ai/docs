import { readBooleanEnv, readEnv, type EnvMap } from '@repo/env'

const REQUIRED_S3_KEYS = [
  'S3_BUCKET',
  'S3_REGION',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const

type RequiredS3Key = (typeof REQUIRED_S3_KEYS)[number]

export type S3Config = {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string
  forcePathStyle: boolean
}

export const getMissingS3ConfigKeys = (env: EnvMap = process.env): RequiredS3Key[] =>
  REQUIRED_S3_KEYS.filter((key) => !readEnv(key, { env }))

export const hasS3Config = (env: EnvMap = process.env) => getMissingS3ConfigKeys(env).length === 0

export const readS3Config = (env: EnvMap = process.env): S3Config | null => {
  const bucket = readEnv('S3_BUCKET', { env })
  const region = readEnv('S3_REGION', { env })
  const accessKeyId = readEnv('S3_ACCESS_KEY_ID', { env })
  const secretAccessKey = readEnv('S3_SECRET_ACCESS_KEY', { env })

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    return null
  }

  const endpoint = readEnv('S3_ENDPOINT', { env })
  const forcePathStyle = readBooleanEnv('S3_FORCE_PATH_STYLE', { env })

  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle,
  }
}
