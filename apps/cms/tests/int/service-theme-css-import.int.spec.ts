import { describe, expect, it } from 'vitest'

import {
  parseServiceThemeCssTokens,
  toServiceThemeFieldUpdates,
} from '../../src/utils/serviceThemeCssImport'

describe('service theme css import', () => {
  it('parses supported tokens from :root and .dark blocks', () => {
    const parsed = parseServiceThemeCssTokens(`
      :root {
        --background: oklch(1 0 0);
        --radius: 0.875rem;
        --unknown: red;
      }

      .dark {
        --background: oklch(0.147 0.004 49.25);
        --border: oklch(1 0 0 / 10%);
        --radius: 2rem;
      }
    `)

    expect(parsed.light.background).toBe('oklch(1 0 0)')
    expect(parsed.light.radius).toBe('0.875rem')
    expect(parsed.dark.background).toBe('oklch(0.147 0.004 49.25)')
    expect(parsed.dark.border).toBe('oklch(1 0 0 / 10%)')
    expect(parsed.light).not.toHaveProperty('unknown')
    expect(parsed.dark).not.toHaveProperty('radius')
  })

  it('maps parsed tokens to service theme form field paths', () => {
    const parsed = parseServiceThemeCssTokens(`
      \`\`\`css
      :root {
        --card-foreground: oklch(0.147 0.004 49.25);
      }

      .dark {
        --sidebar-primary-foreground: oklch(0.985 0.001 106.423);
      }
      \`\`\`
    `)

    expect(toServiceThemeFieldUpdates(parsed)).toEqual(
      expect.arrayContaining([
        {
          mode: 'light',
          token: 'card-foreground',
          path: 'light.cardForeground',
          value: 'oklch(0.147 0.004 49.25)',
        },
        {
          mode: 'dark',
          token: 'sidebar-primary-foreground',
          path: 'dark.sidebarPrimaryForeground',
          value: 'oklch(0.985 0.001 106.423)',
        },
      ]),
    )
  })

  it('returns no updates when css does not contain supported blocks', () => {
    const parsed = parseServiceThemeCssTokens('--background: red;')
    expect(toServiceThemeFieldUpdates(parsed)).toEqual([])
  })
})
