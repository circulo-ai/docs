import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const richtextSource = readFileSync(resolve(process.cwd(), '../docs/lib/richtext.tsx'), 'utf8')

describe('richtext default component rendering', () => {
  it('does not inject custom class names into block output helpers', () => {
    expect(richtextSource).not.toContain('whitespace-pre-wrap')
    expect(richtextSource).not.toContain('space-y-2')
    expect(richtextSource).not.toContain('font-medium')
    expect(richtextSource).not.toContain('text-muted-foreground')
  })

  it('does not inject extra wrapper structure for component output', () => {
    expect(richtextSource).not.toContain('createElement("figure"')
    expect(richtextSource).not.toContain('createElement("figcaption"')
    expect(richtextSource).not.toContain(
      'createElement("span", {}, nodesToJSX({ nodes: node.children }))',
    )
  })
})
