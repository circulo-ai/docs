import config from '@payload-config'
import { getPayload } from 'payload'

const DEFAULT_INIT_ATTEMPTS = 6
const DEFAULT_RETRY_DELAY_MS = 5000

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) return fallback
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return fallback
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const initializePayloadAtStartup = async () => {
  const attempts = parsePositiveInt(process.env.CMS_PAYLOAD_INIT_ATTEMPTS, DEFAULT_INIT_ATTEMPTS)
  const retryDelayMs = parsePositiveInt(
    process.env.CMS_PAYLOAD_INIT_RETRY_DELAY_MS,
    DEFAULT_RETRY_DELAY_MS,
  )

  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await getPayload({
        config,
        cron: true,
      })

      if (attempt > 1) {
        console.info(`[payload-startup] Payload initialized on retry ${attempt}/${attempts}.`)
      } else {
        console.info('[payload-startup] Payload initialized.')
      }

      return
    } catch (error) {
      lastError = error
      console.error(
        `[payload-startup] Payload initialization failed (attempt ${attempt}/${attempts}).`,
        error,
      )

      if (attempt < attempts) {
        await wait(retryDelayMs)
      }
    }
  }

  const failFast = toBoolean(process.env.CMS_FAIL_FAST_PAYLOAD_INIT, true)
  if (failFast) {
    console.error('[payload-startup] Exhausted initialization retries; exiting process.', lastError)
    process.exit(1)
  }

  console.error('[payload-startup] Exhausted initialization retries; continuing without fail-fast.')
}

export async function register() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }

  if (toBoolean(process.env.CMS_SKIP_STARTUP_PAYLOAD_INIT, false)) {
    return
  }

  await initializePayloadAtStartup()
}
