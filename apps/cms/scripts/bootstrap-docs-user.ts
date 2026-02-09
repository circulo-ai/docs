import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const stripWrappingQuotes = (value: string | undefined) => {
  if (!value) return undefined
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

const email = stripWrappingQuotes(process.env.DOCS_EMAIL)?.trim()
const password = stripWrappingQuotes(process.env.DOCS_PASSWORD)

if (!email || !password) {
  console.log('[bootstrap-docs-user] Skipping: DOCS_EMAIL or DOCS_PASSWORD is not set.')
  process.exit(0)
}

const payload = await getPayload({
  config: await configPromise,
})

const existing = await payload.find({
  collection: 'users',
  where: {
    email: {
      equals: email,
    },
  },
  depth: 0,
  limit: 1,
  overrideAccess: true,
  pagination: false,
})

const userData: {
  email: string
  password: string
  roles: Array<'admin' | 'editor' | 'writer'>
} = {
  email,
  password,
  roles: ['admin'],
}

if (existing.docs.length > 0) {
  const user = existing.docs[0]
  await payload.update({
    collection: 'users',
    id: user.id,
    data: userData,
    depth: 0,
    overrideAccess: true,
  })
  console.log(`[bootstrap-docs-user] Updated user: ${email}`)
} else {
  await payload.create({
    collection: 'users',
    data: userData,
    depth: 0,
    overrideAccess: true,
  })
  console.log(`[bootstrap-docs-user] Created user: ${email}`)
}

await payload.destroy()
