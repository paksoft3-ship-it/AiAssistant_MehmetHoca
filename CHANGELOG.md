# Changelog

All notable changes to EidosUs (Academic Active Reading Assistant). Updated after every implementation phase.

## [Unreleased]

### Fixes & natural voices (2026-06-26)
- **Modal width bug (all dialogs)**: in Tailwind v4 the custom `--spacing-{sm,md,lg,xl}` design tokens collided with the t-shirt size scale, so `max-w-xl` resolved to **32px** and every dialog (Accessibility, Assistant settings, History, Privacy, "Nasıl Çalışır?", note editor, …) opened as a thin vertical strip. Replaced the 11 `max-w-*` usages with arbitrary rem values (`max-w-[28rem]`, `max-w-[36rem]`, …) and documented the collision in `src/index.css`. This also fixes the "Nasıl çalıştığını gör" button appearing broken (the guide was opening invisibly).
- **Natural neural voices** (spec §9): added a key-less `/api/tts` proxy (Microsoft Edge Read-Aloud via `msedge-tts`) offering real Turkish neural voices (Emel/Ahmet) and others, replacing the single robotic device voice. Voice picker groups "Doğal Sesler (çevrimiçi)" vs "Cihaz Sesleri (çevrimdışı)"; a natural voice is the default for the document language. Honest about the network round-trip (text sent to Microsoft); device voices remain a one-click offline fallback. Gated by the `naturalVoices` flag, rate-limited (300/min) separately from AI endpoints.
- **"Yapay zeka ile tartış" in the note flow** (spec §14.4): wired the existing (previously orphaned) discussion service into the note editor — an inline, source-scoped AI discussion thread with "Nota ekle" to pull insights into the note. Gated by the `discussion` flag.
- **Library persistence diagnostics** (spec §18): `saveArticle` now reads the document back after writing and raises a clear error if it didn't persist; a startup `checkStorageWritable()` probe shows a banner when local storage is unavailable (e.g. iOS Safari Private mode) — so an uploaded/imported document that can't be saved is explained, not silently missing.
- Verified: `npm run lint` (pass), `npm test` (127 pass), `npm run build` (pass), and a live `/api/tts` synthesis round-trip (MP3 returned).

### Beta Phase 8/9 — Entitlements & open-source/beta docs (2026-06-26)
- **Feature-entitlement abstraction** (spec §26): `resolveEntitlement` (tested) — every feature is free in the beta; core reading/notes/export and accessibility are in the always-free set; no ad SDK. A future quota/server resolver can swap in without changing call sites.
- **Open-source docs**: `CONTRIBUTING.md`, `SECURITY.md` (incl. the SSRF posture), `CODE_OF_CONDUCT.md`.
- **Beta/readiness docs**: `docs/BETA_TEST_CHECKLIST.md`, `docs/SUSTAINABILITY_MODEL.md`, `docs/FINAL_IMPLEMENTATION_REPORT.md`.
- **LICENSE**: intentionally not added — flagged for the maintainer's decision (permissive MIT/Apache recommended; a legal choice).
- Cloud sync (Supabase) remains deferred: the repository pattern already isolates persistence so a cloud repo can be added without UI changes.
- Verified: `npm run lint` (pass), `npm test` (127 pass, +3), `npm run build` (pass).

### Beta Phase 7 — Accessibility mode & audit (2026-06-26)
- **Accessibility mode panel** (spec §27): persisted preferences for high contrast, large text, reduced motion, spoken interface hints, and auto-describe figures. Enabling the mode applies root CSS classes (tested `accessibilityClasses` helper); core reading/notes stay free — toggles never gate features.
- **Skip-to-content link** ("İçeriğe geç") on home and reader, plus a `#main-content` landmark.
- **Global a11y CSS**: high-contrast borders/text, large-text root scaling, reduced-motion (also honours `prefers-reduced-motion`).
- Builds on existing dialog semantics (`role="dialog"`/`aria-modal`, Esc + focus handling) and `role="progressbar"` indicators added earlier.
- **`docs/ACCESSIBILITY_AUDIT.md`** records what's done and the known follow-ups (axe-in-CI, full focus-trap, ARIA live region for the active sentence).
- Verified: `npm run lint` (pass), `npm test` (124 pass, +3), `npm run build` (pass).

### Beta Phase 6 — Assistant, standby & honest voice messaging (2026-06-26)
- **Assistant personalization** (spec §15): name the assistant (default "Sokrates"), which doubles as the wake phrase; language, hands-free, and spoken-feedback toggles. Persisted in localStorage; settings modal reachable from the home tools row. Tested normalizer (incl. a blank-name fallback bug the test caught).
- **Centralized multilingual command map** (`features/assistant/services/commands.ts`, CLAUDE.md §10.4): TR/EN wake-phrase + command phrases with tested `matchWakePhrase` / `matchCommand` (longest-match wins, so "okumayı durdur" beats bare "dur").
- **Standby interface** (spec §16): a dimmed, low-distraction overlay showing the assistant name, current document, position, and live mic status, with an exit button — reachable from a reader-toolbar button. Honest messaging is part of the UI: it works only while the page is open and may stop when backgrounded/locked.
- **`docs/NATIVE_APP_ROADMAP.md`**: documents background wake-word / locked-screen / always-on mic as deferred native capabilities the web beta does not claim.
- Verified: `npm run lint` (pass), `npm test` (121 pass, +7), `npm run build` (pass).

### Beta Phase 5 — Projects, History & Invite (2026-06-26)
- **Share / Invite** (spec §24): an invite dialog with copy-link, native Web Share, e-mail (mailto — no paid provider), and WhatsApp. Invite links carry no personal data and there are no referral rewards. Logic in a tested `invite.ts`.
- **Activity History** (spec §22): a new Dexie table + `historyRepository` records uploads, URL imports, opens, note create/delete, exports, and project creation (non-sensitive metadata only — titles/format, never note content). A History timeline modal shows the events with a privacy-aware "Geçmişi Temizle". Event formatting is a tested pure helper.
- **Projects** (spec §23): a new Dexie table + `projectRepository`/`useProjects`. Create projects, assign documents (per-card selector), filter the library by project, and delete a project (documents are detached, never deleted). `AcademicDocument` gained an optional `projectId`.
- **Library cards** now show the source domain (for URL imports) and the assigned project.
- Dexie schema bumped to **v2** (additive: `projects`, `history` tables + `documents.projectId` index; auto-migrates, no data transform).
- Verified: `npm run lint` (pass), `npm test` (114 pass, +8), `npm run build` (pass).

### Beta Phase 4 — URL / article import (2026-06-26)
- **"Linkten İçerik Ekle"** on the home page (Beta spec §11): paste a public article or PDF URL and read it like any uploaded document. Source provenance (`sourceUrl`, `sourceDomain`) is preserved on the document.
- **SSRF-safe server route** `POST /api/import/url` (rate-limited, Zod-validated):
  - Pure, exhaustively-tested guard (`urlGuard.ts`): http(s)-only, blocks `localhost`/`.local`/`.internal`/metadata hosts, and rejects loopback / private / link-local / CGNAT / IPv4-mapped-private addresses (IPv4 + IPv6).
  - Network layer (`fetchSource.ts`): **re-resolves and re-validates the host at every redirect hop** (anti-rebinding), 12 s timeout, 6 MB size cap (streamed, defends against lying `Content-Length`), max 5 redirects, content-type allowlist (PDF / HTML / text).
  - HTML is extracted with **Mozilla Readability** (jsdom) into reading-order paragraphs; PDFs are returned as base64 for the existing client parser; plain text is paragraph-split. Privacy: logs only domain + outcome, never content.
- New deps: `@mozilla/readability`; `jsdom` promoted to a runtime dependency (server bundle).
- Verified: `npm run lint` (pass), `npm test` (106 pass, +10 SSRF-guard tests), `npm run build` (pass), and **live smoke tests** against the running server — localhost/private-IP/`file:` correctly rejected (400); a real Wikipedia article imported (191 paragraphs, title + domain resolved); too-thin pages rejected with a clear message.

### Beta Phase 3 — Export center: CSV + XLSX (2026-06-26)
- **CSV export** (Beta spec §20): RFC-4180 escaping (quotes fields with commas/quotes/newlines), CRLF line endings, and a UTF-8 BOM so Excel renders Turkish characters correctly. Dependency-free.
- **XLSX export**: a minimal but valid `.xlsx` workbook generated from hand-assembled OOXML + JSZip (declared as a direct dep; lazy-loaded into its own 2.7 kB chunk so the main bundle is unaffected). Integer cells (No/Sayfa) are written as real numbers; text uses inline strings (multi-line notes + Turkish preserved).
- **Shared tabular core** (`tabularExport.ts`, tested): one row per note with columns honouring the existing field toggles (source excerpt / raw transcript / tags) plus cleaned note, final note, origin, and created date. Both CSV and XLSX render from it, staying column-consistent.
- Export dialog now offers all five formats (Markdown / DOCX / TXT / CSV / XLSX); `ExportRecord.format` extended accordingly.
- Verified: `npm run lint` (pass), `npm test` (96 pass), `npm run build` (pass; xlsx in a lazy chunk).

### Beta Phase 2 — Notes: tag UX (2026-06-26)
- **Academic tag suggestions + autocomplete** (Beta spec §19): a default academic tag catalog (Yöntem, Hipotez, Literatür, Bulgu, …, each with an English mapping for later i18n) plus a tested `suggestTags()` helper that merges the user's own existing tags with the catalog, excludes already-chosen tags, and filters by what's typed after the last comma. Quick-add chips were wired into the note editor; the notes panel already had tag filtering, search, sort, edit, delete, and jump-to-source.
- Note: exact text-selection anchoring (`SourceAnchor.selectedText`) and the raw/cleaned/final three-field model were already implemented in earlier phases. The **discussion-to-note** conversion flow remains a deferred secondary feature.
- Verified: `npm run lint` (pass), `npm test` (91 pass), `npm run build` (pass).

### Beta Phase 1 — Navigation & onboarding (2026-06-26)
- **Reliable Home / browser-back from the reader** (Beta spec §7): the router-less reader now pushes a single history entry when a document opens, so the **browser Back button returns to the home/library** instead of leaving the site — fixing the reported difficulty of getting back from the reader on mobile. The brand logo doubles as a Home control while reading, and the reader top bar has an explicit **"Ana Sayfa"** button (replacing the ambiguous "Kapat"). Returning home preserves the document, notes, and reading position (close ≠ delete).
- **Unsaved-note guard**: leaving the reader (Home button or hardware Back) while a note is being recorded now prompts for confirmation before discarding the in-progress transcript; cancelling re-pushes the history entry so the user stays put. The guard lives in a single `popstate` handler so both paths behave identically.
- **Accessible "Nasıl Çalışır?" guide** (Beta spec §8): a dedicated modal (`features/onboarding/`) with 8 numbered steps covering the full workflow (yükle → dinle → durdur → not → tartış → kaydet → devam → dışa aktar). It is keyboard reachable (Esc to close, focus moved in on open and restored on close), announced as `role="dialog"`/`aria-modal`, and includes a **"Sesli Dinle"** read-aloud button that narrates the steps with the user's chosen voice/speed for the accessibility & hands-free cases. Entry points added to the hero ("Nasıl Çalıştığını Gör") and the navbar.
- Step content is centralized in `howItWorksSteps.ts` (with a tested `buildHowItWorksScript()` narration builder) so it can move to i18n keys later without touching the UI.
- **"Okumaya Devam Et" (Continue Reading) on home** (Beta spec §10): the app no longer auto-jumps into the reader on load — users land on home, where a prominent card resumes the most-recently-opened started document at its saved position (title, page X / total, % complete, last-opened date, note count, with an ARIA `progressbar`). Selection is handled by a tested `selectContinueEntry()` helper that prefers the last-active document and otherwise the most recently opened *started* document.
- **Navbar density fix for small screens**: responsive gaps (`gap-sm md:gap-lg`), shrinkable controls (`min-w-0`), and a narrower voice selector on mobile to reduce overflow on phones. (A full per-screen mobile audit + 44px tap-target sweep remains a dedicated next slice.)
- Verified: `npm run lint` (pass), `npm test` (85 pass, +6), `npm run build` (pass).

### Phase 7 — Landing, privacy & beta readiness (2026-06-21)
- **Marketing landing sections** on the dashboard (no-document view): clearer hero, "Who it's for", a **beta waitlist**, and an FAQ — with no fake testimonials, user counts, or university logos (CLAUDE.md §15).
- **Beta waitlist**: `POST /api/waitlist` (Zod-validated, rate-limited) appends signups to an isolated, git-ignored `data/waitlist.jsonl` (privacy-safe logging — never logs the address). The client `WaitlistForm` falls back to a local queue if the server is unreachable, so it never blocks the app.
- **In-app privacy notice** (`PrivacyNotice` modal) reachable from an always-visible footer and the dashboard, stating truthfully where data goes (local storage, possible online STT, AI sends only required text) with no "100% offline"/"guaranteed premium voice" claims, plus a "Verilerimi Sil" action.
- **Scanned/image-only PDF detection** (CLAUDE.md §7.3/§18): the PDF parser now detects near-empty text extraction and surfaces a clear "this PDF may be scanned; OCR is not supported yet" message instead of returning an empty document.
- **README rewritten** from the AI Studio template to a real EidosUs README (overview, setup, scripts, config, privacy, docs index).
- Verified: `npm run lint` (pass), `npm test` (79 pass), `npm run build` (pass), and live waitlist endpoint smoke tests (200 + isolated file write; 400 on invalid email).

### Phase 5 — Reader & library polish (2026-06-21)
- **In-document search** in the reader (`features/reader/services/documentSearch.ts`): a search box with match count and prev/next navigation that jumps to and reveals each matching segment (Turkish-aware, case-insensitive).
- **Reading progress** indicator: a live progress bar (% of segments read) in the reader toolbar, with ARIA `progressbar` semantics.
- **Library filters & sorting** (`features/library/services/libraryQueries.ts`): search by title/author/filename, filter by language, and sort by most-recent / title / note count / reading progress, with an empty-results state.
- **Responsive reader/notes layout**: on phones a tab switcher toggles between the Reader and Notes panels (showing the note count); desktop keeps both side by side. After saving a note, mobile auto-switches to the Notes tab.
- **Clearer dictation state**: the note editor now detects Web Speech recognition support (`features/speech/services/capabilities.ts`) and, when unavailable, replaces the mic controls with a clear "type your note" message instead of an inert button.
- **Tests:** +13 (now 79 total) — library search/filter/sort/progress and in-document search + next-match wrap-around.
- Verified: `npm run lint` (pass), `npm test` (79 pass), `npm run build` (pass).

### Phase 6 — Secondary features cleanup & trust fixes (2026-06-21)
- **Removed the fake "premium/AI" virtual voices.** Deleted the invented `virtual:tr:tolga/cem/dilara/yelda` entries and the `isVirtual`/`virtualPitch`/`virtualRateMulti` machinery. The voice list now contains only the real voices the browser/OS exposes.
- **Centralized voice ranking** into `features/speech/services/voiceRanking.ts` (one honest, rule-based scorer used by both the speech hook and the Navbar — no more duplicated logic). Removed the dishonest scoring boosts (the +300 for invented persona names and the +150 gender boost); kept legitimate quality/cloud/provider hints.
- **Removed misleading voice UI**: the 🌟 "premium" star, the fabricated `[Erkek]/[Kadın]` gender labels (which keyed off the fake names), and the "zero truncation of premium voices" comment. The voice picker now shows just the real name + language with an honest "depends on your device" tooltip.
- **Fixed duplicate speed options** via a single `SPEED_OPTIONS` source of truth (`features/speech/services/speechOptions.ts`) — no more `1`/`1.0` or `2`/`2.0` duplicates.
- **Gated figure/graph explanation behind `featureFlags.figureExplanation` (OFF by default)** and **removed the client-side fabricated graph fallback** (which invented an "upward trend"/"efficiency rise"); it now uses the same honest "cannot see the figure" message. With the flag off, a figure caption is simply read like any other line.
- **Modularized secondary AI calls** off inline `fetch`: `features/translation/services/translationService.ts` (now used by `App`'s translation flow) and `features/discussion/services/discussionService.ts` (stable boundary for the not-yet-rewired discussion feature) — both via the centralized `lib/apiClient`.
- **Deleted dead `SpeechRecordingModal`** (superseded by `NoteEditorModal` in Phase 2; it carried misleading copy and duplicate logic) and rebranded the Navbar to the product name from `config/product`.
- **Tests:** +8 (now 66 total) — honest voice ranking (no persona/gender bias, cloud/natural preference, language-correct selection) and de-duplicated speed options.
- Verified: `npm run lint` (pass), `npm test` (66 pass), `npm run build` (pass).

### Phase 4 — Export (2026-06-21)
- **Markdown, DOCX, and TXT export** of research notes (`features/export`). DOCX uses the `docx` npm package; Markdown/TXT are pure string renderers.
- **Export structure** (CLAUDE.md §12.1): product-neutral title ("Araştırma Notları"), document metadata, export date, note count; per note: number, page, source excerpt, final note, optional raw transcript, tags, and created date. Notes ordered by source position by default.
- **Export options**: include/exclude source excerpts, raw transcripts, and tags; order by source position or creation time; and export selected notes only (with an in-dialog note picker).
- **Sanitized filenames** (`sanitizeFilename`) and a `Dışa Aktar` action in the notes panel opening an `ExportDialog`.
- **`ExportRecord`** written to IndexedDB on each successful export (via a new `exportRepository`); recording failures never block the download.
- **Performance**: the heavy `docx` dependency is **lazy-loaded** (dynamic `import()`) only when a DOCX export runs — split into its own chunk, dropping the main JS bundle from ~1.65 MB to ~1.31 MB.
- **Tests:** +9 (now 58 total) — filename sanitization, export-model ordering/filtering, Markdown + TXT rendering with option toggles, and a DOCX generation test (packs to a non-empty buffer with the ZIP/`PK` magic header).
- Verified: `npm run lint` (pass), `npm test` (58 pass), `npm run build` (pass; `docx` in a separate chunk).

### Phase 3 — AI note cleaning (2026-06-21)
- **New endpoint `POST /api/ai/clean-note`** that turns a raw transcript into a structured academic note, returning **Zod-validated** `{ cleanedNote, suggestedTags, warnings }`. The prompt enforces the trust rules (preserve meaning, improve only grammar/clarity, never invent evidence/citations/certainty, warn instead of hallucinating).
- **Modularized the AI server** into `server/`: `config.ts` (env-driven model/port/limits; no hardcoded model name), `services/geminiClient.ts` (shared client + retry **+ request timeout**), `services/prompts/cleanNote.ts`, `services/cleanNoteService.ts` (testable core, independent of Express/Gemini), `schemas/cleanNote.ts` (Zod), `middleware/rateLimit.ts`, and `routes/aiNotes.ts`.
- **Hardened the API**: JSON body-size limit (`express.json({ limit })`), rate limiting on `/api/ai` and `/api/gemini` (30 req/min/IP, configurable), request timeouts, consistent error codes (`invalid_request` 400, `ai_unavailable` 503, `ai_error` 502), and **privacy-safe logging** (sizes only, never document/note text).
- **`server.ts` now uses the shared config/client** and reads `GEMINI_MODEL` from config across all endpoints (removed the hardcoded `gemini-3.5-flash` in 4 places).
- **Removed the fabricated graph-trend fallback** (trust fix, ahead of Phase 6): `summarize-graph` now returns an honest "cannot see the figure" message and the prompt forbids inventing trends/percentages (CLAUDE.md §14.6).
- **Wired the editor's "Akademik Olarak Düzenle"**: `NoteEditorModal.onRequestClean` calls the endpoint via a centralized `lib/apiClient.ts` and `features/notes/services/aiNoteCleaning.ts`. The cleaned note is stored separately (`cleanedAcademicNote`, `aiCleaningStatus`), the **raw transcript is never overwritten**, suggested tags pre-fill, warnings surface, and AI failure degrades gracefully (the note still saves). The affordance is hidden when the `aiNoteCleaning`/`aiFeatures` flags are off. Notes show a "Düzenlendi" badge when AI-cleaned.
- **Tests:** +8 (now 49 total) — request-schema validation and the clean-note service (unavailable, success, code-fence JSON, non-JSON, empty note, model failure) via an injected `generate`.
- Verified: `npm run lint` (pass), `npm test` (49 pass), `npm run build` (pass), and live endpoint smoke tests (503 `ai_unavailable` with no key, 400 on invalid body).

### Phase 2 — Source-linked note workflow (2026-06-21)
- **Switched persistence to IndexedDB.** `App.tsx` no longer reads/writes the prototype localStorage document/note keys; documents and notes now live in IndexedDB through the repositories. Every uploaded/sample document is auto-saved to the library; the last-opened document is restored on reload (`eidosus_last_active_doc` preference).
- **Replaced the page/line note model with the source-aware `ResearchNote` + `SourceAnchor` model.** Notes now store the exact source excerpt, page, global index, surrounding context, a preserved `rawTranscript`, a separate `finalNote`, tags, and origin (voice/typed/discussion).
- **Added exact text selection in the reader** (`ReaderPanel`): selecting text shows a "Bu Metne Not Ekle" action bar; the note anchors to that selection. With no selection, the note anchors to the active spoken segment.
- **New source-linked note editor** (`NoteEditorModal`): source excerpt card, dictation + typed raw transcript (raw is never overwritten), final academic note, tags, and an honest STT privacy note. Saving works fully without AI. Includes an "Akademik Olarak Düzenle" affordance that stays hidden until Phase 3 wires the handler.
- **New research notes panel** (`ResearchNotesPanel`): source excerpt, final note, tags, origin badge, jump-to-source, inline edit, delete-with-confirm, play-aloud, search, tag filter, and sort (source position / created / updated).
- **New feature modules**: `features/notes` (services `sourceAnchor`, `noteFactory`, `noteQueries`; hook `useResearchNotes`) and `features/documents` (`documentMapper`, `documentService`; hook `useLibrary`).
- **"Verilerimi Sil"** data-reset action (`db/reset.ts`) on the dashboard, with confirmation, plus a local-first privacy note.
- Removed `.doc` from the upload `accept` list (parser already rejects it).
- **Tests:** +14 (now 41 total) — source anchor building, note factory/tags, note queries (search/sort/filter/collect), document mapper round-trip, and a documentService+notes IndexedDB integration test (save → list → open → attach note → cascade delete; reading-position round-trip).
- Verified: `npm run lint` (pass), `npm test` (41 pass), `npm run build` (pass), and a production-server smoke test (HTTP 200, app served).
- Known limitation: the translated article variant is in-memory for the session only; the stored base document remains the original (translation persistence is a Phase 6 concern).

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
