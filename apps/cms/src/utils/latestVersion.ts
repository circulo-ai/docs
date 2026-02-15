import type { PayloadRequest } from 'payload'

import { revalidateDocsLatestVersionCache } from './docsRevalidation'

type RelationValue = number | string | { id?: number | string } | null | undefined

type ServiceSnapshot = {
  id: number | string
  slug?: string
  latestVersion?: RelationValue
}

const getRelationId = (value: RelationValue) => {
  if (!value) return null
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'object' && value.id !== undefined) return value.id
  return null
}

export const extractServiceId = (value: RelationValue) => getRelationId(value)

const sameId = (a: number | string | null, b: number | string | null) =>
  a !== null && b !== null && String(a) === String(b)

const sameNullableId = (a: number | string | null, b: number | string | null) =>
  (a === null && b === null) || sameId(a, b)

const resolveServiceSnapshot = async (
  req: PayloadRequest,
  serviceId: number | string,
): Promise<ServiceSnapshot | null> => {
  try {
    const service = await req.payload.findByID({
      collection: 'services',
      id: serviceId,
      req,
      overrideAccess: true,
      depth: 0,
    })

    return service as ServiceSnapshot
  } catch {
    return null
  }
}

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

  const service = await resolveServiceSnapshot(req, serviceId)
  if (!service) return

  const currentLatestId = extractServiceId(service.latestVersion)
  const latestId = await resolveLatestPublishedVersionId(req, serviceId)
  if (sameNullableId(currentLatestId, latestId)) return

  await req.payload.update({
    collection: 'services',
    id: serviceId,
    data: {
      latestVersion: latestId,
    },
    req,
    overrideAccess: true,
  })

  await revalidateDocsLatestVersionCache(req, { serviceSlug: service.slug ?? null })
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
