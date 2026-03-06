type Mode = 'SESSION' | 'QUICK'

interface ModeToggleProps {
  value:    Mode
  onChange: (m: Mode) => void
}

export function ModeToggle({ value, onChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
      {(['QUICK', 'SESSION'] as Mode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={[
            'flex-1 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
            value === m
              ? 'bg-brand-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200',
          ].join(' ')}
        >
          {m === 'QUICK' ? 'Pesaje Rápido' : 'Modo Sesión'}
        </button>
      ))}
    </div>
  )
}
