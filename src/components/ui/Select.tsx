import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:    string
  error?:    string
}

export function Select({ label, error, className = '', ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className={[
          'w-full rounded-lg bg-gray-800 border text-gray-100 px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-red-500' : 'border-gray-600',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
