# ARCHITECTURE — EidosUs (Academic Active Reading Assistant)

_Living document. Describes the target architecture and the current state of the migration toward it._

## 1. High-level shape

```
Browser (React 19 SPA, Vite)
  ├─ pages/        route-level screens (Landing, Library, Reader, Settings)
  ├─ features/     feature modules (documents, reader, speech, notes, library, export, translation, discussion, figures)
  ├─ db/           Dexie (IndexedDB) database + repositories  ← local-first persistence
  ├─ lib/          apiClient, errors, logger, ids
  └─ config/       product.ts (brand), featureFlags.ts
        │  fetch (same origin)
        ▼
Express server (server/) — Gemini proxy ONLY
  ├─ routes/       aiNotes, translation, discussion, figures
  ├─ services/     geminiClient + prompts
  └─ schemas/      Zod request/response validation
        │
        ▼
   Google Gemini (@google/genai)  ← API key lives ONLY here
```

Local-first: all documents, parsed segments, and notes live in the browser (IndexedDB). The server is a thin, stateless proxy that exists only to keep the Gemini key off the client and to validate/shape AI requests. The core reading + note workflow works with the server/AI entirely unavailable.

## 2. Persistence model

- **IndexedDB via Dexie** is the source of truth for documents, pages, segments, notes, discussions, translations, export records, and original file blobs.
- **localStorage** holds only small preferences: theme, `voiceURI`, playback `rate`, last active document id, feature flags, and the one-time migration flag.
- **Repository pattern** (`db/repositories/*`): the UI talks to repositories, never to Dexie tables directly, so a future cloud (Supabase) repository can be swapped in without touching components.
- **Migration**: a one-time, non-destructive importer reads the legacy keys `sesli_makale_aktif`, `sesli_makale_notlar`, `sesli_makale_arsiv`, validates them, writes them into IndexedDB (preserving notes and reading positions), sets a completion flag, and leaves the old localStorage data intact until success. A reset/recovery action lives in Settings.

## 3. Data flow — the core workflow

```
upload → documentParser (pdfjs-dist / mammoth, npm, off-CDN)
       → AcademicDocument + DocumentPage[] + TextSegment[]  (IndexedDB)
       → Reader renders segments, TTS reads active segment
       → user selects text  OR  uses active segment  → SourceAnchor (text + page + segmentId + context)
       → dictate/type → rawTranscript (never overwritten)
       → optional POST /api/ai/clean-note → cleanedAcademicNote
       → user edits → finalNote
       → ResearchNote saved (raw + cleaned + final + anchor + timestamps)
       → export → Markdown / DOCX / TXT
```

## 4. Server boundaries (AI)

Each AI capability is an isolated route + prompt module; no monolithic `server.ts`:

- `routes/aiNotes.ts` → `POST /api/ai/clean-note` (grammar/clarity only, never invent evidence).
- `routes/translation.ts` → translate-text / translate-batch (original preserved, page-aligned).
- `routes/discussion.ts` → debate scoped to the supplied excerpt + nearby context.
- `routes/figures.ts` → figure explanation from caption + surrounding text only; **no fabricated trends**, gated behind a feature flag.

Cross-cutting: Zod validation, body-size limit, rate limiting, request timeout, abort support, structured logging that never logs full document text, and a config-driven model name (`GEMINI_MODEL`, default per `.env.example`).

## 5. Feature flags

`config/featureFlags.ts` gates secondary/experimental features (translation, discussion, hands-free, figure explanation, future Supabase auth) so the core reader+notes path is never blocked by them.

## 6. Migration status (updated each phase)

- **Phase 0 (done):** audit + baseline; stack confirmed; docs created.
- **Phase 1 (done):** local parser deps (CDN removed), Dexie persistence + repositories, non-destructive localStorage→IndexedDB migration, domain model, `config/product` + `featureFlags`, `lib/ids`, Vitest harness.
- **Phase 2 (done):** documents + notes wired onto repositories (`features/documents`, `features/notes` with `useLibrary`/`useResearchNotes`); exact text selection → `SourceAnchor`; `ResearchNote` editor (raw/final/tags) + research notes panel (jump-to-source, search/tag/sort); "Verilerimi Sil" reset.
- **Phase 3 (done):** modular `server/` (config/geminiClient/prompts/schemas/middleware/routes); `POST /api/ai/clean-note` (Zod-validated, testable service core); rate limiting + body limit + timeouts + privacy-safe logging; editor wired via `lib/apiClient` + `aiNoteCleaning` with graceful fallback; raw transcript preserved; fabricated graph-trend fallback removed. 49 tests.
- Phases 4–8: see `IMPLEMENTATION_PLAN.md`.

> Until a module is migrated, the legacy `App.tsx`/`useSpeechEngine.ts`/`documentParser.ts` paths remain in place and working. Nothing is deleted before its replacement is implemented and tested (CLAUDE.md §4.10).
