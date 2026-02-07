'use client'

import type { DefaultCellComponentProps } from 'payload'

import { icons } from 'lucide-react'
import React from 'react'

type IconGroupValue =
  | {
      source?: 'lucide' | 'custom'
      lucide?: string
      customSvg?:
        | {
            url?: string
            filename?: string
            alt?: string
          }
        | string
        | number
        | null
    }
  | string
  | null
  | undefined

const FALLBACK_ICON = 'BookOpen'

const resolveLucide = (iconName?: string) => {
  if (!iconName) return icons[FALLBACK_ICON]
  return icons[iconName as keyof typeof icons] ?? icons[FALLBACK_ICON]
}

const getCustomSvgMeta = (customSvg: unknown) => {
  if (!customSvg || typeof customSvg !== 'object') return {}
  const record = customSvg as Record<string, unknown>
  const maybeUrl = record.url
  const maybeFilename = record.filename
  const maybeAlt = record.alt
  return {
    url: typeof maybeUrl === 'string' ? maybeUrl : undefined,
    filename: typeof maybeFilename === 'string' ? maybeFilename : undefined,
    alt: typeof maybeAlt === 'string' ? maybeAlt : undefined,
  }
}

const IconCell: React.FC<DefaultCellComponentProps<any, IconGroupValue>> = ({ cellData }) => {
  if (!cellData) return null

  if (typeof cellData === 'string') {
    const LucideIcon = resolveLucide(cellData)
    return (
      <span className="inline-flex items-center gap-2">
        <LucideIcon aria-hidden="true" size={16} />
        <span>{cellData}</span>
      </span>
    )
  }

  const source = cellData.source ?? 'lucide'

  if (source === 'custom') {
    const { url, filename, alt } = getCustomSvgMeta(cellData.customSvg)
    if (url) {
      return (
        <span className="inline-flex items-center gap-2">
          <img alt={alt ?? filename ?? 'Custom icon'} height={16} src={url} width={16} />
          <span>{filename ?? 'Custom SVG'}</span>
        </span>
      )
    }

    return <span>Custom SVG</span>
  }

  const lucideName = cellData.lucide
  const LucideIcon = resolveLucide(lucideName)
  return (
    <span className="inline-flex items-center gap-2">
      <LucideIcon aria-hidden="true" size={16} />
      <span>{lucideName ?? FALLBACK_ICON}</span>
    </span>
  )
}

export default IconCell
