import type { PayloadRequest } from 'payload'

type RelationValue = number | string | { id?: number | string } | null | undefined

const getRelationId = (value: RelationValue) => {
  if (!value) return null
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'object' && value.id !== undefined) return value.id
  return null
}

export const extractServiceId = (value: RelationValue) => getRelationId(value)

const sameId = (a: number | string | null, b: number | string | null) =>
  a !== null && b !== null && String(a) === String(b)

const resolveLatestPublishedVersionId = async (req: PayloadRequest, serviceId: number | string) => {
  const { docs } = await req.payload.find({
    collection: 'docVersions',
    where: {
      service: { equals: serviceId },
      status: { equals: 'published' },
    },
    sort: '-versionKey',
    limit: 1,
    req,
    overrideAccess: true,
  })

  return docs[0]?.id ?? null
}

export const syncLatestVersionForService = async (
  req: PayloadRequest,
  serviceId: number | string | null,
) => {
  if (!serviceId) return

  const latestId = await resolveLatestPublishedVersionId(req, serviceId)

  await req.payload.update({
    collection: 'services',
    id: serviceId,
    data: {
      latestVersion: latestId,
    },
    req,
    overrideAccess: true,
  })
}

export const syncLatestVersionForServices = async (
  req: PayloadRequest,
  currentServiceId: number | string | null,
  previousServiceId: number | string | null,
) => {
  await syncLatestVersionForService(req, currentServiceId)

  if (previousServiceId && !sameId(previousServiceId, currentServiceId)) {
    await syncLatestVersionForService(req, previousServiceId)
  }
}
