'use client'

import { useFormFields } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import {
  parseServiceThemeCssTokens,
  toServiceThemeFieldUpdates,
} from '../utils/serviceThemeCssImport'

type FieldDispatch = (action: { type: 'UPDATE'; path: string; value: unknown }) => void

const ServiceThemeCssImportField: React.FC = () => {
  const dispatchFields = useFormFields(([_, dispatch]) => dispatch) as FieldDispatch | undefined
  const [source, setSource] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const applySource = useCallback(
    (nextSource: string) => {
      const updates = toServiceThemeFieldUpdates(parseServiceThemeCssTokens(nextSource))
      if (!updates.length) {
        setStatusMessage('No supported tokens were found in :root or .dark blocks.')
        return
      }

      if (!dispatchFields) {
        setStatusMessage('Unable to update fields right now. Please refresh and try again.')
        return
      }

      for (const update of updates) {
        dispatchFields({
          type: 'UPDATE',
          path: update.path,
          value: update.value,
        })
      }

      const lightCount = updates.filter((update) => update.mode === 'light').length
      const darkCount = updates.length - lightCount

      setStatusMessage(
        `Imported ${updates.length} token${updates.length === 1 ? '' : 's'} (${lightCount} light, ${darkCount} dark).`,
      )
    },
    [dispatchFields],
  )

  const onSourceChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSource(event.target.value)
    setStatusMessage('')
  }, [])

  const onSourcePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = event.clipboardData.getData('text').trim()
      if (!pastedText) return

      event.preventDefault()
      setSource(pastedText)
      applySource(pastedText)
    },
    [applySource],
  )

  const onApply = useCallback(() => applySource(source), [applySource, source])

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        padding: '1rem',
      }}
    >
      <label
        htmlFor="service-theme-css-import"
        style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}
      >
        Paste CSS theme tokens
      </label>
      <p style={{ color: 'var(--theme-elevation-700)', margin: '0 0 0.5rem' }}>
        Paste a block containing <code>:root</code> and <code>.dark</code> token values, then apply
        to auto-fill theme fields.
      </p>
      <textarea
        id="service-theme-css-import"
        onChange={onSourceChange}
        onPaste={onSourcePaste}
        placeholder=":root { --background: ... }&#10;&#10;.dark { --background: ... }"
        style={{
          background: 'var(--theme-input-bg)',
          border: '1px solid var(--theme-elevation-250)',
          borderRadius: '0.375rem',
          color: 'var(--theme-elevation-900)',
          fontFamily: 'var(--font-mono)',
          minHeight: '10rem',
          padding: '0.5rem 0.75rem',
          resize: 'vertical',
          width: '100%',
        }}
        value={source}
      />
      <div style={{ alignItems: 'center', display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
        <button className="btn btn--style-primary btn--size-small" onClick={onApply} type="button">
          Auto-fill fields
        </button>
        {statusMessage ? (
          <span role="status" style={{ color: 'var(--theme-elevation-700)', fontSize: '0.875rem' }}>
            {statusMessage}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default ServiceThemeCssImportField
