import React from 'react'

type Color = 'green' | 'red' | 'yellow' | 'gray' | 'blue'

interface BadgeProps {
  color?:    Color
  children:  React.ReactNode
  dot?:      boolean
  className?: string
}

const colors: Record<Color, string> = {
  green:  'bg-green-900/60 text-green-300 border border-green-700',
  red:    'bg-red-900/60 text-red-300 border border-red-700',
  yellow: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
  gray:   'bg-gray-700/60 text-gray-300 border border-gray-600',
  blue:   'bg-blue-900/60 text-blue-300 border border-blue-700',
}

const dotColors: Record<Color, string> = {
  green:  'bg-green-400',
  red:    'bg-red-400',
  yellow: 'bg-yellow-400',
  gray:   'bg-gray-400',
  blue:   'bg-blue-400',
}

export function Badge({ color = 'gray', children, dot = false, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors[color]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />}
      {children}
    </span>
  )
}
