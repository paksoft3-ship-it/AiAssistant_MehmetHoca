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

## Deploy to Render

The whole app (API + SPA) runs as **one Node web service**, so Render needs no code changes. A `render.yaml` Blueprint is included.

### 1. Push the repo to GitHub

```bash
# create an empty repo at https://github.com/new  (name it e.g. "eidosus"), then:
git remote add origin https://github.com/<your-username>/eidosus.git
git push -u origin main
```

(Secrets are safe to push: `.env*` is git-ignored — only `.env.example` is committed.)

### 2. Create the Render service

1. Sign up / log in at **https://render.com** (free).
2. Click **New +** → **Blueprint**.
3. **Connect your GitHub account** and pick the `eidosus` repo. Render reads `render.yaml` automatically.
4. On the review screen, set the secret env var **`GEMINI_API_KEY`** to your key (the Blueprint marks it `sync: false`, so Render prompts you). Leave it blank to deploy without AI features.
5. Click **Apply** / **Create**. Render runs `npm ci --include=dev && npm run build`, then `npm start`, and gives you an `https://eidosus-xxxx.onrender.com` URL.

### Notes
- **Cold starts:** the free plan sleeps after ~15 min idle; the first request then takes ~30–50s. Upgrade the plan (or use a paid host) to keep it always-on.
- **Waitlist storage:** signups are written to an ephemeral disk and reset on each deploy/restart. Core app data is unaffected (it lives in each user's browser). Add a Render Disk or a database later if you need durable signups.
- **Region:** `render.yaml` uses `frankfurt`; change it to the region nearest your users.

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
