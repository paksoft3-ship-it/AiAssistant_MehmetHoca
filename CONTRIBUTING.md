# Contributing to EidosUs

Thanks for your interest! EidosUs is an academic active-reading & note-taking
assistant. This guide covers local setup and contribution conventions.

## Local setup

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY if you want AI features
npm run dev                  # Vite + Express on http://localhost:3000
```

Useful scripts:

```bash
npm run lint    # tsc --noEmit (type check)
npm run test    # vitest
npm run build   # client + server bundle
npm run start   # run the production bundle
```

## Project layout

- `src/features/*` — feature modules (documents, reader, notes, export, url-import,
  invitations, history, projects, assistant, accessibility, entitlements, …),
  each with `services/`, `components/`, `hooks/`.
- `src/db/*` — Dexie (IndexedDB) database + repositories (the UI never touches
  Dexie directly).
- `server/*` — Express routes/services (AI note cleaning, waitlist, URL import).

## Conventions

- **TypeScript strict**; avoid `any`. Keep domain logic out of JSX.
- **Pure logic is unit-tested** (Vitest). New parsing/export/guard/format logic
  should ship with tests.
- **No secrets in the client.** API keys stay server-side; validate all API
  input (Zod) and never log document/note content.
- **Honest copy**: don't claim "fully offline", guaranteed premium voices,
  background wake-word, or evidence-free figure analysis.
- Keep user-facing Turkish professional and correct.

## Before opening a PR

1. `npm run lint && npm run test && npm run build` all pass.
2. Update `CHANGELOG.md` and relevant `docs/*`.
3. Describe what changed, what's verified, and any known limitations.

## Reporting security issues

See [SECURITY.md](./SECURITY.md). Please do not file public issues for
vulnerabilities.
