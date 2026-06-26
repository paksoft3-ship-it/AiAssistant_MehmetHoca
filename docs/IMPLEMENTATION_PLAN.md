# IMPLEMENTATION PLAN — EidosUs

_Updated at the end of every phase. Source of truth for sequencing._

## Status legend
✅ done · 🔄 in progress · ⏳ pending

---

## Beta track (expanded spec — P0/P1/P2/P3)

The original Phases 0–7 (below) are merged. The Beta spec adds new P0 work on top.

### Beta Phase 1 — Navigation & onboarding 🔄
- ✅ Reliable Home / browser-back from reader (history entry + `popstate` → home; clickable brand; "Ana Sayfa" button). Preserves doc/notes/position.
- ✅ Unsaved-note guard on leaving the reader (single `popstate` guard; re-push on cancel).
- ✅ Accessible "Nasıl Çalışır?" guide modal with numbered steps + "Sesli Dinle" read-aloud (`features/onboarding/`); entry points on hero + navbar.
- ✅ "Okumaya Devam Et" surfaced on home (tested `selectContinueEntry`); removed startup auto-open into reader.
- ✅ Conservative navbar density fix for small screens.
- ⏳ Carry-over: full **mobile responsiveness audit** of every screen (modal heights, keyboard obstruction, 44px tap targets, bottom-sheet modals) across 360/390/768px; product-copy refocus. (Next slice.)

### Beta Phase 2 — Notes ✅ (tag UX)
- ✅ Academic tag catalog + `suggestTags` autocomplete + quick-add chips. Exact selection + raw/clean/final already existed. Discussion-to-note conversion deferred.

### Beta Phase 3 — Export ✅
- ✅ CSV (BOM, RFC-4180) + XLSX (JSZip/OOXML, lazy chunk) + shared tabular core, all five formats in the dialog.

### Beta Phase 4 — URL import ✅
- ✅ SSRF-safe `/api/import/url` (guard + per-hop revalidation + caps), Readability extraction, PDF passthrough, provenance fields, home-page import form.

### Beta Phase 5 — Projects / History / Invite ✅
- ✅ Invite dialog (copy/share/mailto/WhatsApp), activity History (Dexie v2 + repo + timeline modal + clear), Projects (Dexie + repo + filter/create/assign), library source-domain + project chips.

### Beta Phase 6 — Assistant / standby ✅
- ✅ Assistant prefs (name/wake/toggles), centralized multilingual command map, Standby overlay, honest messaging, `NATIVE_APP_ROADMAP.md`.

### Beta Phase 7 — Accessibility ✅
- ✅ A11y mode panel + persisted prefs, root-class application, skip link, global a11y CSS, `ACCESSIBILITY_AUDIT.md`. Follow-ups: axe-in-CI, full focus-trap, ARIA live region.

### Remaining Beta backlog (not started)
- **i18n (TR/EN keys)** — cross-cutting; deferred (large, touches every string). **Phase 8** storage/Supabase cloud abstraction + advanced privacy tools. **Phase 9** open-source prep (CONTRIBUTING/SECURITY/LICENSE), expanded landing, beta test checklist, regression. Also deferred: discussion-to-note conversion, annotated-PDF export, camera OCR (all explicitly later-stage per spec). See spec §§25–28, §41.

---

## Phase 0 — Audit & baseline ✅
- Extract single workspace from duplicate ZIPs; archive the zips. ✅
- `npm install`, `npm run lint`, `npm run build` (all pass; no test script). ✅
- Write `CURRENT_STATE_AUDIT.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `KNOWN_LIMITATIONS.md`, `DATA_MODEL.md`, `PRIVACY_AND_DATA_FLOW.md`, `MANUAL_TEST_CHECKLIST.md`, `CHANGELOG.md`. ✅
- Initialize git, baseline commit (no secrets/build output/large docs). ✅

## Phase 1 — Architecture & persistence 🔄 (core done)
- ✅ Add `config/product.ts` (brand = EidosUs) and `config/featureFlags.ts`.
- ✅ Add local parser deps `pdfjs-dist`, `mammoth`; configure PDF.js worker for Vite (`?url`); remove CDN `<script>` tags from `index.html`.
- ✅ Define the new domain types (`AcademicDocument`, `DocumentPage`, `TextSegment`, `SourceAnchor`, `ReadingAnchor`, `ResearchNote`, …) alongside legacy `types.ts`.
- ✅ Add Dexie database (`db/database.ts`) + repositories (documents, notes).
- ✅ Implement one-time non-destructive localStorage→IndexedDB migration; run on startup (`main.tsx`).
- ✅ Introduce Vitest + first unit tests (parser pure fns, ids, migration mapping + IndexedDB roundtrip) — 27 passing.
- ✅ Add `lib/ids.ts`; update `.env.example`; rename package to `eidosus`.
- ⏳ Carry-over into Phase 2: Settings reset/recovery action (UI); wiring the reader/notes UI onto the repositories; further extraction of helpers from `App.tsx`/`useSpeechEngine.ts`. (Deferred deliberately so App is re-wired together with the new note workflow rather than half-migrated.)

## Phase 2 — Core source-linked note workflow ✅
- ✅ Exact text selection in the reader → `SourceAnchor` (selectedText + page + globalIndex + surrounding context).
- ✅ Fallback to active spoken segment when nothing is selected.
- ✅ `ResearchNote` with raw/cleaned/final fields; note editor (`NoteEditorModal`) with source excerpt card + tags.
- ✅ Jump-to-source; notes search / tag filter / sort (`ResearchNotesPanel`).
- ✅ Phase 1 carry-over: documents + notes wired onto IndexedDB repositories (`useLibrary`, `useResearchNotes`); "Verilerimi Sil" reset.
- Note: segment offsets (`startOffset`/`endOffset`) and `segmentId` resolution are not yet populated (globalIndex + selectedText carry the anchor); cleaned-note AI button lands in Phase 3; translation persistence deferred to Phase 6.

## Phase 3 — AI note cleaning ✅
- ✅ `POST /api/ai/clean-note` with Zod-validated `{cleanedNote, suggestedTags, warnings}`; testable service core.
- ✅ Modular `server/` (config, geminiClient, prompts, schemas, middleware, routes); model from config.
- ✅ Hardening: body-size limit, rate limiting, timeouts, consistent error codes, privacy-safe logging.
- ✅ Cleaned-note UI wired (`onRequestClean`); raw transcript never overwritten; graceful fallback; flag-gated.
- ✅ Trust fix (early): removed fabricated graph-trend fallback (honest message instead).

## Phase 4 — Export ✅
- ✅ Markdown + DOCX (`docx` npm, lazy-loaded) + TXT renderers; `ExportDialog` with options.
- ✅ Options: include raw/excerpts/tags, order by source/created, selected-notes-only.
- ✅ Sanitized filenames; `ExportRecord` persisted via `exportRepository`; 9 export tests.

## Phase 5 — Reader & library polish ✅
- ✅ In-document search (match count + prev/next jump) and reading-progress bar.
- ✅ Library search / language filter / sort (recent, title, notes, progress).
- ✅ Responsive: mobile reader/notes tab switcher; desktop side-by-side.
- ✅ Dictation capability detection → clear keyboard-only fallback message.

## Phase 6 — Secondary features cleanup ✅
- ✅ Removed fake virtual "premium/AI" voices + virtual-voice machinery.
- ✅ Centralized honest voice ranking (`features/speech`); removed persona/gender scoring bias and duplicated logic.
- ✅ Removed misleading voice UI (🌟 star, fake gender labels, "zero truncation"); honest device-dependent copy.
- ✅ Single `SPEED_OPTIONS` source — duplicate speed entries fixed.
- ✅ Figure explanation gated behind `featureFlags.figureExplanation` (off); fabricated graph fallback removed (honest message).
- ✅ Modularized translation + discussion services (via `lib/apiClient`); deleted dead `SpeechRecordingModal`.
- Note: discussion UI is not re-wired into the reader yet (service + endpoint exist); a candidate for a later phase.

## Phase 7 — Landing, privacy & beta readiness ✅
- ✅ Landing marketing sections (hero, who-it's-for, beta waitlist, FAQ) on the dashboard — no fake social proof.
- ✅ Waitlist: isolated, rate-limited `POST /api/waitlist` (Zod) → git-ignored JSONL; client local fallback.
- ✅ In-app `PrivacyNotice` (footer + dashboard) + "Verilerimi Sil".
- ✅ Scanned/image-only PDF detection with honest message; README rewritten.
- ⏳ Manual browser test checklist execution remains a human step (`docs/MANUAL_TEST_CHECKLIST.md`).

## Phase 8 — Optional auth/cloud ⏳
- Supabase auth behind a flag; cloud repository implementing the same interface. Not an MVP blocker.

---

## Change log of plan deviations
- _(none yet)_
