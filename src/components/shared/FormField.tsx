import type { ReactNode } from 'react'

interface FormFieldProps {
  htmlFor?: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

export function FormField({ htmlFor, label, hint, error, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-text-secondary">{hint}</p> : null}
      {error ? (
        <p className="mt-1 text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
