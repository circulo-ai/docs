export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return
  }

  try {
    const { initializePayloadAtStartup } = await import('./instrumentation.node')
    await initializePayloadAtStartup()
  } catch (error) {
    console.error('[payload-startup] instrumentation register failed.', error)
    throw error
  }
}
