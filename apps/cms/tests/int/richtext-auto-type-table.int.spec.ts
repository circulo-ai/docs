import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const richtextSource = readFileSync(resolve(process.cwd(), '../docs/lib/richtext.tsx'), 'utf8')

describe('richtext auto type table rendering', () => {
  it('imports fumadocs typescript generator + ui integration', () => {
    expect(richtextSource).toContain('from "fumadocs-typescript"')
    expect(richtextSource).toContain('from "fumadocs-typescript/ui"')
  })

  it('maps fumaAutoTypeTable blocks to a dedicated renderer', () => {
    expect(richtextSource).toContain('if (normalized === "fumaautotypetable")')
    expect(richtextSource).toContain('renderAutoTypeTableFromFields(fields)')
    expect(richtextSource).toContain('fumaAutoTypeTable: ({ node }) =>')
  })

  it('supports advanced auto type table options from cms fields', () => {
    expect(richtextSource).toContain('getAutoTypeTableGenerator(fields)')
    expect(richtextSource).toContain('asJsonRecord(fields.options)')
    expect(richtextSource).toContain('asJsonRecord(fields.shiki)')
    expect(richtextSource).toContain('asJsonRecord(fields.props) ?? {}')
  })
})
