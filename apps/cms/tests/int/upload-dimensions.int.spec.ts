import { describe, expect, it } from 'vitest'

import { resolveUploadRenderDimensions } from '../../../docs/lib/upload-dimensions'

describe('resolveUploadRenderDimensions', () => {
  it('prefers explicit upload field dimensions over media intrinsic dimensions', () => {
    const result = resolveUploadRenderDimensions({
      fieldHeight: 240,
      fieldWidth: 420,
      mediaHeight: 1080,
      mediaWidth: 1920,
    })

    expect(result).toEqual({
      height: 240,
      width: 420,
    })
  })

  it('falls back to media intrinsic dimensions when no explicit dimensions are set', () => {
    const result = resolveUploadRenderDimensions({
      mediaHeight: 768,
      mediaWidth: 1024,
    })

    expect(result).toEqual({
      height: 768,
      width: 1024,
    })
  })

  it('parses numeric string fields and ignores invalid values', () => {
    const result = resolveUploadRenderDimensions({
      fieldHeight: 'bad',
      fieldWidth: '600',
      mediaHeight: 500,
      mediaWidth: 900,
    })

    expect(result).toEqual({
      height: 500,
      width: 600,
    })
  })
})
