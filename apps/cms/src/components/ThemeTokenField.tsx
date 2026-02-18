'use client'

import type { StaticDescription, TextFieldClientComponent, TextFieldClientProps } from 'payload'

import {
  FieldDescription,
  FieldError,
  FieldLabel,
  RenderCustomComponent,
  fieldBaseClass,
  useField,
} from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
import React, { useCallback, useMemo } from 'react'

type ThemeTokenFieldAdminConfig = {
  className?: string
  description?: unknown
  custom?: {
    colorPreview?: boolean
    placeholder?: string
  }
}
type UseFieldArgs = NonNullable<Parameters<typeof useField>[0]>

const resolvePreviewColor = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return trimmed
  }
  return CSS.supports('color', trimmed) ? trimmed : undefined
}

const ThemeTokenField: TextFieldClientComponent = (props) => {
  const { field, path: pathFromProps, readOnly, validate } = props
  const textField = field as TextFieldClientProps['field']

  const {
    admin: adminConfig = {} as ThemeTokenFieldAdminConfig,
    label,
    localized,
    required,
  } = textField

  const { className, description } = adminConfig as ThemeTokenFieldAdminConfig
  const colorPreview = adminConfig.custom?.colorPreview ?? false
  const placeholder = adminConfig.custom?.placeholder

  const {
    customComponents: { Description, Error, Label } = {},
    disabled,
    path,
    setValue,
    showError,
    value,
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: validate as UseFieldArgs['validate'],
  })

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  const valueAsString = useMemo(() => {
    if (typeof value === 'string') return value
    if (value === null || value === undefined) return ''
    return String(value)
  }, [value])

  const previewColor = useMemo(
    () => (colorPreview ? resolvePreviewColor(valueAsString) : undefined),
    [colorPreview, valueAsString],
  )

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly || disabled) return
      const nextValue = event.target.value
      setValue(nextValue)
    },
    [disabled, readOnly, setValue],
  )

  return (
    <div
      className={[
        fieldBaseClass,
        className,
        showError && 'error',
        (readOnly || disabled) && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      style={styles}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel label={label} localized={localized} path={path} required={required} />
        }
      />

      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={Error}
          Fallback={<FieldError path={path} showError={showError} />}
        />

        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: '0.5rem',
          }}
        >
          {colorPreview ? (
            <span
              aria-label={previewColor ? `Preview: ${previewColor}` : 'No color preview'}
              style={{
                backgroundColor: previewColor ?? 'transparent',
                border: '1px solid var(--theme-elevation-300)',
                borderRadius: '0.5rem',
                display: 'inline-block',
                flexShrink: 0,
                height: '2rem',
                width: '2rem',
              }}
            />
          ) : null}

          <input
            className={`${fieldBaseClass}__input`}
            disabled={readOnly || disabled}
            onChange={onInputChange}
            placeholder={placeholder}
            type="text"
            value={valueAsString}
          />
        </div>
      </div>

      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={<FieldDescription description={description as StaticDescription} path={path} />}
      />
    </div>
  )
}

export default ThemeTokenField
