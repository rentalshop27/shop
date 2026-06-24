import type { HTMLAttributes, InputHTMLAttributes } from 'react'

export function TextField({
  label,
  value,
  onChange,
  required,
  inputMode,
  type = 'text',
  placeholder,
  maxLength,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  type?: InputHTMLAttributes<HTMLInputElement>['type']
  placeholder?: string
  maxLength?: number
  disabled?: boolean
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      <input
        value={value}
        inputMode={inputMode}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
