# Changelog

All notable changes to EidosUs (Academic Active Reading Assistant). Updated after every implementation phase.

## [Unreleased]

### Phase 1 — Architecture & persistence (2026-06-21)
- **Removed the CDN dependency for core parsers.** PDF.js (`pdfjs-dist`) and Mammoth (`mammoth`) are now npm dependencies bundled by Vite; the PDF worker is served as a local hashed asset (`?url` import) instead of a hardcoded cdnjs URL. Deleted the `<script>` CDN tags from `index.html`. Behavior preserved.
- **Added local-first IndexedDB persistence (Dexie).** New `src/db/database.ts` (`documents`, `pages`, `segments`, `notes`, `discussions`, `exports`, `fileBlobs`) with the repository pattern (`src/db/repositories/*`) so the UI never touches Dexie directly and a cloud repo can be added later.
- **Added a one-time, non-destructive localStorage→IndexedDB migration** (`src/db/migrations.ts`): reads the legacy keys (`sesli_makale_aktif/notlar/arsiv`), maps them to the new domain model (preserving notes, raw text as `rawTranscript`+`finalNote`, and reading position), writes to IndexedDB, sets a completion flag, and leaves legacy keys intact. Wired to run in the background on startup (`main.tsx`).
- **Introduced the source-aware domain model** (`src/types/domain.ts`): `AcademicDocument`, `DocumentPage`, `TextSegment`, `SourceAnchor`, `ReadingAnchor`, `ResearchNote` (raw/cleaned/final), `AcademicDiscussion`, `ExportRecord`, `FileBlobRecord`. Legacy `types.ts` kept and bridged via adapters.
- **Added config modules**: `config/product.ts` (brand = EidosUs, single source for renaming) and `config/featureFlags.ts` (gates AI/translation/discussion/hands-free/figures/cloud; figure explanation OFF by default).
- **Added stable ID helper** `lib/ids.ts` (`crypto.randomUUID` + tested RFC4122 fallback).
- **Added a test harness (Vitest + jsdom + fake-indexeddb)** and the first 27 unit tests: parser pure functions (language detection, heading/graph detection, header-footer/disclaimer filtering, paragraph reconstruction, sentence segmentation, spaced-text collapse, file-size formatting), ID generation, and the migration (pure mapping + IndexedDB roundtrip, non-destructive + idempotent + skip-when-done). `npm test` script added.
- **Replaced AI Studio `.env.example` placeholders** with the documented config (`GEMINI_API_KEY`, `GEMINI_MODEL`, `PORT`, `AI_FEATURES_ENABLED`, Supabase, and `VITE_FEATURE_*` flags). Renamed the package from `react-example` to `eidosus`.
- Verified: `npm run lint` (pass), `npm test` (27 pass), `npm run build` (pass). Note: client bundle grew (parsers now bundled, not CDN) — code-splitting deferred to the performance phase.

### Phase 0 — Audit & baseline (2026-06-21)
- Extracted a single workspace from the two duplicate delivery ZIPs (identical file inventory; differing only in zip timestamps). Archived both zips under `_zip_archive/`.
- Verified baseline: `npm install` (0 vulnerabilities), `npm run lint` (tsc — pass), `npm run build` (vite + esbuild — pass). No test script exists yet.
- Confirmed the existing React + TypeScript + Vite + Express stack has no critical blocker; **no stack migration** (per CLAUDE.md §5.1).
- Authored baseline docs: `CURRENT_STATE_AUDIT.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `DATA_MODEL.md`, `KNOWN_LIMITATIONS.md`, `PRIVACY_AND_DATA_FLOW.md`, `MANUAL_TEST_CHECKLIST.md`, and this changelog.
- Catalogued behavior to preserve and trust/architecture problems to fix (fabricated graph trends, fake "premium" virtual voices, premium-voice guarantees, monolithic files, localStorage storing full documents, page/line-only note anchoring, CDN parser dependency, unhardened AI endpoints, duplicate speed options, no tests).
- Initialized git and created a baseline commit (excludes secrets, build output, and the delivery zips).
