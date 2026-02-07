'use client'

import type {
  Option,
  OptionObject,
  SelectFieldClientComponent,
  SelectFieldClientProps,
  StaticDescription,
} from 'payload'
import type { OptionProps, SingleValueProps } from 'react-select'

import { getTranslation } from '@payloadcms/translations'
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  ReactSelect,
  RenderCustomComponent,
  fieldBaseClass,
  useField,
  useTranslation,
} from '@payloadcms/ui'
import { mergeFieldStyles } from '@payloadcms/ui/shared'
import { icons } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'
import { components as SelectComponents } from 'react-select'

type IconOption = OptionObject & { value: string }
type ReactSelectProps = React.ComponentProps<typeof ReactSelect>
type IconSelectAdminConfig = {
  className?: string
  description?: unknown
  isClearable?: boolean
  isSortable?: boolean
  placeholder?: ReactSelectProps['placeholder']
}

const resolveIcon = (iconName?: string) =>
  iconName ? (icons[iconName as keyof typeof icons] ?? null) : null

const IconLabel: React.FC<{ iconName?: string; label: React.ReactNode }> = ({
  iconName,
  label,
}) => {
  const Icon = resolveIcon(iconName)

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      {Icon ? <Icon aria-hidden="true" size={16} /> : null}
      <span>{label}</span>
    </span>
  )
}

const IconOptionComponent: React.FC<OptionProps<IconOption, false>> = (props) => {
  const { children, data } = props

  return (
    <SelectComponents.Option {...props}>
      <IconLabel iconName={data.value} label={children} />
    </SelectComponents.Option>
  )
}

const IconSingleValue: React.FC<SingleValueProps<IconOption, false>> = (props) => {
  const { children, data } = props

  return (
    <SelectComponents.SingleValue {...props}>
      <IconLabel iconName={data.value} label={children} />
    </SelectComponents.SingleValue>
  )
}

const formatOptions = (options: Option[]): IconOption[] =>
  options.map((option) => {
    if (typeof option === 'object') {
      return {
        ...option,
        value: String(option.value),
      }
    }

    return {
      label: option,
      value: String(option),
    }
  })

const IconSelectField: SelectFieldClientComponent = (props) => {
  const { field, onChange: onChangeFromProps, path: pathFromProps, readOnly, validate } = props
  const selectField = field as SelectFieldClientProps['field']

  const {
    admin: adminConfig = {} as IconSelectAdminConfig,
    hasMany = false,
    label,
    localized,
    options: optionsFromProps = [],
    required,
  } = selectField

  const {
    className,
    description,
    isClearable = true,
    isSortable = true,
    placeholder,
  } = adminConfig as IconSelectAdminConfig

  const { i18n } = useTranslation()

  const options = useMemo(() => formatOptions(optionsFromProps), [optionsFromProps])

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    path,
    selectFilterOptions,
    setValue,
    showError,
    value,
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: validate as any,
  })

  const onChange = useCallback<NonNullable<ReactSelectProps['onChange']>>(
    (selectedOption) => {
      if (readOnly || disabled) return

      let newValue: string | string[] = hasMany ? [] : ''

      if (selectedOption && hasMany) {
        newValue = Array.isArray(selectedOption)
          ? selectedOption.map((option) => String(option.value))
          : []
      } else if (selectedOption && !Array.isArray(selectedOption)) {
        newValue = String(selectedOption.value)
      }

      if (typeof onChangeFromProps === 'function') {
        onChangeFromProps(newValue)
      }

      setValue(newValue)
    },
    [readOnly, disabled, hasMany, setValue, onChangeFromProps],
  )

  const filterOption = useMemo<ReactSelectProps['filterOption']>(
    () =>
      selectFilterOptions
        ? ({ label: optionLabel, value: optionValue }, search: string) =>
            selectFilterOptions.some(
              (option: string | { value: string }) =>
                (typeof option === 'string' ? option : option.value) === optionValue,
            ) && optionLabel.toLowerCase().includes(search.toLowerCase())
        : undefined,
    [selectFilterOptions],
  )

  const valueToRender = useMemo(() => {
    if (hasMany && Array.isArray(value)) {
      return value.map((val) => {
        const matchingOption = options.find((option) => option.value === val)
        return {
          label: matchingOption ? getTranslation(matchingOption.label, i18n) : val,
          value: matchingOption?.value ?? val,
        }
      })
    }

    if (typeof value === 'string' && value.length > 0) {
      const matchingOption = options.find((option) => option.value === value)
      return {
        label: matchingOption ? getTranslation(matchingOption.label, i18n) : value,
        value: matchingOption?.value ?? String(value),
      }
    }

    return null
  }, [hasMany, value, options, i18n])

  const translatedOptions = useMemo(
    () =>
      options.map((option) => ({
        ...option,
        label: getTranslation(option.label, i18n),
      })),
    [options, i18n],
  )

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  return (
    <div
      className={[
        fieldBaseClass,
        'select',
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
        {BeforeInput}
        <ReactSelect
          components={{
            Option: IconOptionComponent,
            SingleValue: IconSingleValue,
          }}
          disabled={readOnly || disabled}
          filterOption={filterOption}
          isClearable={isClearable}
          isMulti={hasMany}
          isSortable={isSortable}
          onChange={onChange}
          options={translatedOptions}
          placeholder={placeholder}
          showError={showError}
          value={valueToRender ?? undefined}
        />
        {AfterInput}
      </div>
      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={<FieldDescription description={description as StaticDescription} path={path} />}
      />
    </div>
  )
}

export default IconSelectField
