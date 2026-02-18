'use client'

import type {
  OptionObject,
  RelationshipFieldClientComponent,
  RelationshipFieldClientProps,
  StaticDescription,
} from 'payload'
import type { OptionProps, SingleValueProps } from 'react-select'

import {
  FieldDescription,
  FieldError,
  FieldLabel,
  ReactSelect,
  RenderCustomComponent,
  fieldBaseClass,
  useField,
} from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { components as SelectComponents } from 'react-select'

type ThemePreview = {
  background?: string
  primary?: string
  secondary?: string
  accent?: string
}

type ThemeOption = OptionObject & {
  value: string
  preview?: ThemePreview
  isDefault?: boolean
}
type ReactSelectProps = React.ComponentProps<typeof ReactSelect>
type UseFieldArgs = NonNullable<Parameters<typeof useField>[0]>

type RelationshipFieldAdminConfig = {
  className?: string
  description?: unknown
  placeholder?: string
}

type ServiceThemeApiDoc = {
  id: number | string
  name?: string
  light?: {
    background?: string
    primary?: string
    secondary?: string
    accent?: string
  }
}

type ServiceThemesResponse = {
  docs?: ServiceThemeApiDoc[]
}

const DEFAULT_OPTION: ThemeOption = {
  label: 'Use default theme',
  value: '',
  isDefault: true,
}

const resolveOptionLabel = (label: ThemeOption['label']) => (typeof label === 'string' ? label : '')

const normalizeColorToken = (value: unknown) => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return trimmed
  }

  return CSS.supports('color', trimmed) ? trimmed : undefined
}

const PalettePreview: React.FC<{ preview?: ThemePreview }> = ({ preview }) => {
  const tiles = [
    normalizeColorToken(preview?.background),
    normalizeColorToken(preview?.primary),
    normalizeColorToken(preview?.secondary),
    normalizeColorToken(preview?.accent),
  ]

  return (
    <span
      aria-hidden="true"
      style={{
        border: '1px solid var(--theme-elevation-300)',
        borderRadius: '0.375rem',
        display: 'grid',
        flexShrink: 0,
        gap: '1px',
        gridTemplateColumns: 'repeat(2, 0.5rem)',
        gridTemplateRows: 'repeat(2, 0.5rem)',
        overflow: 'hidden',
      }}
    >
      {tiles.map((tile, index) => (
        <span
          key={index}
          style={{
            backgroundColor: tile ?? 'transparent',
            border: tile ? undefined : '1px solid var(--theme-elevation-150)',
            display: 'block',
            height: '0.5rem',
            width: '0.5rem',
          }}
        />
      ))}
    </span>
  )
}

const ThemeOptionLabel: React.FC<{ option: ThemeOption }> = ({ option }) => (
  <span
    style={{
      alignItems: 'center',
      display: 'inline-flex',
      gap: '0.5rem',
      minWidth: 0,
    }}
  >
    {!option.isDefault ? <PalettePreview preview={option.preview} /> : null}
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {resolveOptionLabel(option.label)}
    </span>
  </span>
)

const ThemeOptionComponent: React.FC<OptionProps<ThemeOption, false>> = (props) => (
  <SelectComponents.Option {...props}>
    <ThemeOptionLabel option={props.data} />
  </SelectComponents.Option>
)

const ThemeSingleValue: React.FC<SingleValueProps<ThemeOption, false>> = (props) => (
  <SelectComponents.SingleValue {...props}>
    <ThemeOptionLabel option={props.data} />
  </SelectComponents.SingleValue>
)

const toOption = (doc: ServiceThemeApiDoc): ThemeOption => ({
  label: doc.name?.trim() || `Theme ${String(doc.id)}`,
  value: String(doc.id),
  preview: {
    background: doc.light?.background,
    primary: doc.light?.primary,
    secondary: doc.light?.secondary,
    accent: doc.light?.accent,
  },
})

const resolveFieldValue = (value: unknown) => {
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number') return String(id)
    if (typeof id === 'string') return id
  }
  return ''
}

const parseRelationshipValue = (value: string): number | string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed)
  }
  return trimmed
}

const ServiceThemeSelectField: RelationshipFieldClientComponent = (props) => {
  const { field, path: pathFromProps, readOnly, validate } = props

  const relationshipField = field as RelationshipFieldClientProps['field']

  const { className, description, placeholder } = (relationshipField.admin ??
    {}) as RelationshipFieldAdminConfig

  const {
    customComponents: { Description, Error: ErrorComponent, Label: LabelComponent } = {},
    disabled,
    path,
    setValue,
    showError,
    value,
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: validate as UseFieldArgs['validate'],
  })

  const [fetchedOptions, setFetchedOptions] = useState<ThemeOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadOptions = async () => {
      try {
        const response = await fetch('/api/serviceThemes?limit=200&depth=1&sort=name')
        if (!response.ok) throw new globalThis.Error('Failed to load service themes.')
        const data = (await response.json()) as ServiceThemesResponse
        if (cancelled) return

        const options = (data.docs ?? []).map(toOption)
        setFetchedOptions(options)
      } catch {
        if (cancelled) return
        setFetchedOptions([])
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadOptions()

    return () => {
      cancelled = true
    }
  }, [])

  const options = useMemo(() => [DEFAULT_OPTION, ...fetchedOptions], [fetchedOptions])
  const styles = useMemo(() => mergeFieldStyles(field), [field])
  const currentValue = resolveFieldValue(value)
  const selectedOption = useMemo(
    () => options.find((option) => option.value === currentValue) ?? DEFAULT_OPTION,
    [currentValue, options],
  )

  const onChange = useCallback(
    (option: ThemeOption | null) => {
      if (readOnly || disabled) return
      const nextValue = parseRelationshipValue(option?.value ?? '')
      setValue(nextValue)
    },
    [disabled, readOnly, setValue],
  )

  const onSelectChange = useCallback<NonNullable<ReactSelectProps['onChange']>>(
    (nextValue) => {
      if (Array.isArray(nextValue)) return
      onChange(nextValue ? (nextValue as ThemeOption) : null)
    },
    [onChange],
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
        CustomComponent={LabelComponent}
        Fallback={
          <FieldLabel
            label={relationshipField.label}
            localized={relationshipField.localized}
            path={path}
            required={relationshipField.required}
          />
        }
      />

      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={ErrorComponent}
          Fallback={<FieldError path={path} showError={showError} />}
        />

        <ReactSelect
          components={{
            Option: ThemeOptionComponent,
            SingleValue: ThemeSingleValue,
          }}
          disabled={readOnly || disabled}
          isClearable={!relationshipField.required}
          isMulti={false}
          isSortable={false}
          isLoading={isLoading}
          onChange={onSelectChange}
          options={options}
          placeholder={placeholder ?? 'Select a theme'}
          showError={showError}
          value={selectedOption}
        />
      </div>

      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={<FieldDescription description={description as StaticDescription} path={path} />}
      />
    </div>
  )
}

export default ServiceThemeSelectField
