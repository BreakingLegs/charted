import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
}

const STYLES = {
  primary: 'bg-[var(--color-ink)] text-[var(--color-paper)] hover:opacity-80',
  secondary:
    'border border-[var(--color-border)] bg-[var(--color-paper-card)] text-[var(--color-ink)] hover:border-[var(--color-ink-muted)]',
}

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-medium transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${STYLES[variant]}`}
    >
      {children}
    </button>
  )
}
