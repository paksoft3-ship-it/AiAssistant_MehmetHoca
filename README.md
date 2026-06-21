# EidosUs — Academic Active Reading Assistant

**Akademik Sesli Okuma ve Kaynak Bağlantılı Not Asistanı**

EidosUs is a local-first web app for graduate students, researchers, and academics who read long academic documents and want to capture their own thinking while reading or listening.

The core workflow:

> Upload a paper → listen to it → pause at an important passage → select the exact source text → speak or type your thought → keep the raw transcript → optionally clean it into a structured academic note → edit the final note → export your research notes with the exact source context.

Documents and notes are stored **locally in your browser** (IndexedDB). The optional AI features (note cleaning, translation, discussion) run through a thin server that keeps the API key off the client. The app works fully for reading and note-taking with no AI configured.

## Tech stack

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Express · Dexie (IndexedDB) · `@google/genai` (server-side) · Web Speech API (TTS/STT) · `pdfjs-dist` + `mammoth` (local parsing) · `docx` (export) · Vitest.

## Quick start

```bash
npm install
cp .env.example .env.local      # fill in GEMINI_API_KEY to enable AI features (optional)
npm run dev                     # Express + Vite on http://localhost:3000
```

The app runs without a key — AI actions simply report that they are unavailable.

### Scripts

```bash
npm run dev      # development server (Express serves the API + Vite middleware)
npm run lint     # TypeScript type-check (tsc --noEmit)
npm run test     # Vitest unit/integration tests
npm run build    # production build (vite build + esbuild server bundle)
npm run start    # run the built server (serve NODE_ENV=production for static dist)
```

## Configuration

See `.env.example`. Key variables:

- `GEMINI_API_KEY` — **server-side only**; never exposed to the client.
- `GEMINI_MODEL` — model id (default provided in `.env.example`).
- `PORT`, `AI_FEATURES_ENABLED`, `API_BODY_LIMIT`, `AI_RATE_*`.
- `VITE_FEATURE_*` — client feature flags (figure explanation is off by default).

## Privacy

- Documents, notes, and reading position live **only in your browser** (IndexedDB).
- AI features send only the required text (excerpt + your note + title) to the server → Gemini.
- Speech recognition may use the browser/vendor's online services on some browsers.
- The app does not claim "100% offline" or guaranteed premium voices, and never fabricates figure trends.
- "Verilerimi Sil" permanently deletes all local data. See `docs/PRIVACY_AND_DATA_FLOW.md`.

## Documentation

- `docs/ARCHITECTURE.md` — system design and migration status
- `docs/DATA_MODEL.md` — domain model + legacy migration mapping
- `docs/IMPLEMENTATION_PLAN.md` — phased plan and status
- `docs/CURRENT_STATE_AUDIT.md` — baseline audit of the original prototype
- `docs/KNOWN_LIMITATIONS.md` — honest limitations
- `docs/PRIVACY_AND_DATA_FLOW.md` — where data goes
- `docs/MANUAL_TEST_CHECKLIST.md` — browser test checklist
- `CHANGELOG.md` — per-phase changes

## Status

Beta. Local reading + source-linked notes + export are complete; secondary AI features are optional and flag-gated. Browser-specific behavior (TTS/STT, IndexedDB persistence across reload) is verified via the manual test checklist.
