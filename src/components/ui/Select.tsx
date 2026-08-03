interface SelectProps<T extends string> {
  id: string
  label: string
  value: T | ''
  onChange: (value: T | '') => void
  options: Array<{ value: T; label: string }>
  placeholder?: string
  error?: string
}

export default function Select<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
}: SelectProps<T>) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const opt = options.find((o) => o.value === e.target.value)
          onChange(opt !== undefined ? opt.value : '')
        }}
        className="w-full appearance-none rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink-muted)]/30"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
