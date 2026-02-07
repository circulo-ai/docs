type ServiceIconOption = {
  label: string
  value: string
}

const toTitle = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim()

const SERVICE_ICON_NAMES = [
  'BookOpen',
  'FileText',
  'Code2',
  'TerminalSquare',
  'Server',
  'Database',
  'Cloud',
  'Globe',
  'Shield',
  'Workflow',
  'Blocks',
  'Settings',
  'Rocket',
  'Cpu',
  'Component',
  'Layers',
  'Package',
  'LifeBuoy',
  'Wrench',
  'Bot',
] as const

export const DEFAULT_SERVICE_ICON = 'BookOpen'

export const serviceIconOptions: ServiceIconOption[] = SERVICE_ICON_NAMES.map((value) => ({
  value,
  label: toTitle(value),
}))
