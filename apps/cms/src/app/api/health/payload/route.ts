import config from '@payload-config'
import { getPayload } from 'payload'

const classifyPayloadInitFailure = (message: string) => {
  const normalized = message.toLowerCase()

  if (normalized.includes('cannot connect to postgres')) {
    return 'postgres_connection_failed'
  }
  if (normalized.includes('missing secret key')) {
    return 'missing_payload_secret'
  }
  if (normalized.includes('cannot find module')) {
    return 'module_resolution_failed'
  }
  if (normalized.includes('migration')) {
    return 'migration_failed'
  }

  return 'payload_init_failed'
}

export async function GET() {
  try {
    await getPayload({
      config,
      cron: true,
    })

    return Response.json(
      { ok: true },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    const message = err.message || 'Unknown payload initialization error.'
    const reason = classifyPayloadInitFailure(message)

    console.error('[payload-health] initialization failed', err)

    return Response.json(
      {
        ok: false,
        reason,
        message,
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  }
}
