# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- Never commit automatically, I handle all commits myself
- Always run tsc and eslint before finishing a task
- Always use existing UI components from src/components/ui/ before creating new ones
- Follow the vintage/sepia aesthetic defined in src/index.css

## Project

Charted — a travel route planner built with React 19, TypeScript, Vite, Tailwind CSS v4, and Leaflet (via react-leaflet). Trips are stored client-side in `localStorage`; there is no backend.

## Commands

```bash
npm run dev       # start Vite dev server (http://localhost:5173)
npm run build     # type-check (tsc -b) then production build
npm run lint      # run ESLint over the whole project
npm run preview   # preview the production build
```

There is no test suite/runner configured in this project.

A pre-commit hook (Husky) runs `lint-staged` (ESLint + Prettier check on staged files) and `tsc --noEmit -p tsconfig.app.json` on every commit — expect commits to fail if types or lint don't pass.

## Architecture

### Routing & pages

`src/App.tsx` defines three routes via `react-router-dom`:

- `/` → `HomePage` — grid of `TripCard`s for all saved trips
- `/trips/new` → `NewTripPage` — form to create a trip
- `/trips/:id` → `TripMapPage` — Leaflet map view of a single trip's route

### State & persistence

There is no global store. `src/hooks/useTripStorage.ts` is the single source of truth for trip data: it lazily loads trips from `localStorage` (key `charted_trips`), seeding with `src/data/mockTrips.ts` on first run, and exposes `trips`, `saveTrip`, `updateTrip`, `deleteTrip`. Every page that needs trip data calls this hook independently (it is not a context — each call re-reads/re-derives from its own `useState`, so mutations made via one hook instance won't be seen by another instance until remount/reload).

### Domain model

`src/types/trip.ts` defines the core shapes:

- `Trip` — id, name, `destinations[]`, startDate/endDate (display strings, not ISO), createdAt
- `Destination` — name, lat/lng, `visited` flag, optional `transportToNext` (`TransportType`: plane/car/train/boat/bus)

Route "progress" is derived, not stored: `TripMapPage` computes `lastVisitedIndex` from the last destination with `visited: true` and classifies each leg (line segment between consecutive destinations) as `completed` / `current` / `future` to style the Leaflet `Polyline` (solid red = completed, animated dash = current leg, faded = upcoming). `NewTripPage` currently creates destinations with `lat: 0, lng: 0` (no geocoding is wired up yet).

### UI components

`src/components/ui/` holds generic form primitives (`TextInput`, `Select`, `DatePicker`, `Button`) shared across pages. `src/components/TripCard.tsx` is a domain component (renders a trip summary link). Follow the existing prop-interface + default-export pattern for new components.

### Styling

Tailwind CSS v4 is configured via the `@tailwindcss/vite` plugin (no `tailwind.config.js` — theme lives in `src/index.css` under `@theme`). Use the CSS custom properties defined there instead of raw colors: `--color-paper`, `--color-paper-card`, `--color-ink`, `--color-ink-muted`, `--color-border`, `--color-accent`, plus `--font-family-serif` / `--font-family-sans`. The visual style is a vintage/sepia travel-map aesthetic (see `.vintage-map` tile filter and `.marker-pin` / `.animated-route` in `src/index.css`).

### Linting/formatting conventions

- No semicolons, single quotes, trailing commas, 100-char print width, 2-space indent (`.prettierrc`).
- ESLint uses `typescript-eslint`'s `strictTypeChecked` config plus `react-hooks` and `react-refresh` rules — new code must satisfy strict type-checked linting (no implicit `any`, exhaustive checks, etc.).
