import React from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
type Size    = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  icon?:     React.ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:   'bg-brand-600 hover:bg-brand-700 text-white border border-brand-700',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600',
  danger:    'bg-red-700 hover:bg-red-600 text-white border border-red-600',
  ghost:     'bg-transparent hover:bg-gray-700 text-gray-300 border border-transparent',
  success:   'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500',
}

const sizes: Record<Size, string> = {
  sm:  'px-3 py-1.5 text-xs',
  md:  'px-4 py-2 text-sm',
  lg:  'px-5 py-2.5 text-base',
  xl:  'px-8 py-4 text-lg font-semibold',
}

export function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  icon,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : icon}
      {children}
    </button>
  )
}
