interface DatePickerProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  min?: string
  max?: string
}

export default function DatePicker({
  id,
  label,
  value,
  onChange,
  error,
  min,
  max,
}: DatePickerProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]"
      >
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        min={min}
        max={max}
        className="w-full rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-ink-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink-muted)]/30"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
