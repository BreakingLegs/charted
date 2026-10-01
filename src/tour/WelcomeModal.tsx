import Button from '../components/ui/Button'

interface WelcomeModalProps {
  onTakeTour: () => void
  onSkip: () => void
}

export default function WelcomeModal({ onTakeTour, onSkip }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-sm border border-[var(--color-border)] bg-[var(--color-paper-card)] p-8 text-center shadow-lg">
        <h2 className="font-[family-name:var(--font-family-serif)] text-3xl font-bold tracking-tight text-[var(--color-ink)]">
          Welcome to Charted.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Charted helps you plan multi-stop trips, track the route on a map, and mark off each
          destination as you go.
        </p>
        <div className="mt-7 flex flex-col gap-2.5">
          <Button variant="primary" onClick={onTakeTour}>
            Take the tour
          </Button>
          <Button variant="secondary" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  )
}
