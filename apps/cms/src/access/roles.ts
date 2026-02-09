import type { Access, FieldAccess } from 'payload'

export type UserRole = 'admin' | 'editor' | 'writer'

const normalizeRoles = (roles: UserRole[] | UserRole) => (Array.isArray(roles) ? roles : [roles])

export const hasRole = (user: unknown, roles: UserRole[] | UserRole): boolean => {
  if (!user || typeof user !== 'object') return false

  const userRoles = (user as { roles?: string[] }).roles
  if (!Array.isArray(userRoles)) return false

  const allowed = normalizeRoles(roles)
  return userRoles.some((role) => allowed.includes(role as UserRole))
}

export const writerRoles: UserRole[] = ['writer', 'editor', 'admin']
export const editorRoles: UserRole[] = ['editor', 'admin']

export const allowRoles =
  (roles: UserRole[] | UserRole): Access =>
  ({ req }) =>
    hasRole(req.user, roles)

export const allowRolesField =
  (roles: UserRole[] | UserRole): FieldAccess =>
  ({ req }) =>
    hasRole(req.user, roles)

export const isAdmin = allowRoles('admin')
export const isAdminField = allowRolesField('admin')
export const isEditor = allowRoles(editorRoles)
export const isWriter = allowRoles(writerRoles)

export const readPublishedOrRoles =
  (roles: UserRole[] | UserRole): Access =>
  ({ req }) => {
    if (hasRole(req.user, roles)) return true
    return {
      status: {
        equals: 'published',
      },
    }
  }
