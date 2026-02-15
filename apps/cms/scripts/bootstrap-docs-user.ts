import { getPayload } from 'payload'
import { readEnv } from '@repo/env'
import configPromise from '../src/payload.config'

const email = readEnv('DOCS_EMAIL')
const password = readEnv('DOCS_PASSWORD')

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
