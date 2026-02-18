export type ServiceThemeToken =
  | 'background'
  | 'foreground'
  | 'card'
  | 'card-foreground'
  | 'popover'
  | 'popover-foreground'
  | 'primary'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'destructive'
  | 'border'
  | 'input'
  | 'ring'
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'radius'
  | 'sidebar'
  | 'sidebar-foreground'
  | 'sidebar-primary'
  | 'sidebar-primary-foreground'
  | 'sidebar-accent'
  | 'sidebar-accent-foreground'
  | 'sidebar-border'
  | 'sidebar-ring'

export const SERVICE_THEME_LIGHT_TOKENS: ServiceThemeToken[] = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'radius',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
]

export const SERVICE_THEME_DARK_TOKENS: Array<Exclude<ServiceThemeToken, 'radius'>> = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
]

export const SERVICE_THEME_LIGHT_DEFAULTS: Record<ServiceThemeToken, string> = {
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.147 0.004 49.25)',
  card: 'oklch(1 0 0)',
  'card-foreground': 'oklch(0.147 0.004 49.25)',
  popover: 'oklch(1 0 0)',
  'popover-foreground': 'oklch(0.147 0.004 49.25)',
  primary: 'oklch(0.216 0.006 56.043)',
  'primary-foreground': 'oklch(0.985 0.001 106.423)',
  secondary: 'oklch(0.97 0.001 106.424)',
  'secondary-foreground': 'oklch(0.216 0.006 56.043)',
  muted: 'oklch(0.97 0.001 106.424)',
  'muted-foreground': 'oklch(0.553 0.013 58.071)',
  accent: 'oklch(0.97 0.001 106.424)',
  'accent-foreground': 'oklch(0.216 0.006 56.043)',
  destructive: 'oklch(0.577 0.245 27.325)',
  border: 'oklch(0.923 0.003 48.717)',
  input: 'oklch(0.923 0.003 48.717)',
  ring: 'oklch(0.709 0.01 56.259)',
  'chart-1': 'oklch(0.646 0.222 41.116)',
  'chart-2': 'oklch(0.6 0.118 184.704)',
  'chart-3': 'oklch(0.398 0.07 227.392)',
  'chart-4': 'oklch(0.828 0.189 84.429)',
  'chart-5': 'oklch(0.769 0.188 70.08)',
  radius: '0.875rem',
  sidebar: 'oklch(0.985 0.001 106.423)',
  'sidebar-foreground': 'oklch(0.147 0.004 49.25)',
  'sidebar-primary': 'oklch(0.216 0.006 56.043)',
  'sidebar-primary-foreground': 'oklch(0.985 0.001 106.423)',
  'sidebar-accent': 'oklch(0.97 0.001 106.424)',
  'sidebar-accent-foreground': 'oklch(0.216 0.006 56.043)',
  'sidebar-border': 'oklch(0.923 0.003 48.717)',
  'sidebar-ring': 'oklch(0.709 0.01 56.259)',
}

export const SERVICE_THEME_DARK_DEFAULTS: Record<Exclude<ServiceThemeToken, 'radius'>, string> = {
  background: 'oklch(0.147 0.004 49.25)',
  foreground: 'oklch(0.985 0.001 106.423)',
  card: 'oklch(0.216 0.006 56.043)',
  'card-foreground': 'oklch(0.985 0.001 106.423)',
  popover: 'oklch(0.216 0.006 56.043)',
  'popover-foreground': 'oklch(0.985 0.001 106.423)',
  primary: 'oklch(0.923 0.003 48.717)',
  'primary-foreground': 'oklch(0.216 0.006 56.043)',
  secondary: 'oklch(0.268 0.007 34.298)',
  'secondary-foreground': 'oklch(0.985 0.001 106.423)',
  muted: 'oklch(0.268 0.007 34.298)',
  'muted-foreground': 'oklch(0.709 0.01 56.259)',
  accent: 'oklch(0.268 0.007 34.298)',
  'accent-foreground': 'oklch(0.985 0.001 106.423)',
  destructive: 'oklch(0.704 0.191 22.216)',
  border: 'oklch(1 0 0 / 10%)',
  input: 'oklch(1 0 0 / 15%)',
  ring: 'oklch(0.553 0.013 58.071)',
  'chart-1': 'oklch(0.488 0.243 264.376)',
  'chart-2': 'oklch(0.696 0.17 162.48)',
  'chart-3': 'oklch(0.769 0.188 70.08)',
  'chart-4': 'oklch(0.627 0.265 303.9)',
  'chart-5': 'oklch(0.645 0.246 16.439)',
  sidebar: 'oklch(0.216 0.006 56.043)',
  'sidebar-foreground': 'oklch(0.985 0.001 106.423)',
  'sidebar-primary': 'oklch(0.488 0.243 264.376)',
  'sidebar-primary-foreground': 'oklch(0.985 0.001 106.423)',
  'sidebar-accent': 'oklch(0.268 0.007 34.298)',
  'sidebar-accent-foreground': 'oklch(0.985 0.001 106.423)',
  'sidebar-border': 'oklch(1 0 0 / 10%)',
  'sidebar-ring': 'oklch(0.553 0.013 58.071)',
}

export const SERVICE_THEME_PREVIEW_TOKENS: Array<
  'background' | 'primary' | 'secondary' | 'accent'
> = ['background', 'primary', 'secondary', 'accent']

export const SERVICE_THEME_COLOR_TOKENS = new Set<ServiceThemeToken>(
  SERVICE_THEME_LIGHT_TOKENS.filter((token) => token !== 'radius'),
)

const toSegmentCase = (value: string) =>
  value.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())

export const serviceThemeTokenToFieldName = (token: ServiceThemeToken) => toSegmentCase(token)

export const serviceThemeTokenToCssVariable = (token: ServiceThemeToken) => `--${token}`

export const serviceThemeTokenLabel = (token: ServiceThemeToken) =>
  token
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
