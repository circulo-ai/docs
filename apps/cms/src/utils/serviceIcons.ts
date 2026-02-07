import { icons } from 'lucide-react'

type ServiceIconOption = {
  label: string
  value: string
}

const toTitle = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim()

const SERVICE_ICON_NAMES = Object.keys(icons).filter(
  (iconName) => typeof icons[iconName as keyof typeof icons] === 'function',
)

export const DEFAULT_SERVICE_ICON = SERVICE_ICON_NAMES.includes('BookOpen')
  ? 'BookOpen'
  : (SERVICE_ICON_NAMES[0] ?? 'BookOpen')

export const serviceIconOptions: ServiceIconOption[] = SERVICE_ICON_NAMES.sort((a, b) =>
  a.localeCompare(b),
).map((value) => ({
  value,
  label: toTitle(value),
}))
