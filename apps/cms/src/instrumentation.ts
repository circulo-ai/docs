export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }

  const { initializePayloadAtStartup } = await import('./instrumentation.node')
  await initializePayloadAtStartup()
}
