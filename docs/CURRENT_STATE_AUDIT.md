# CURRENT STATE AUDIT — EidosUs / Sesli Makale Asistanı

_Audit date: 2026-06-21 · Phase 0._
_This document records the prototype **as found**, before any refactor. It is the baseline reference for the implementation plan._

---

## 0. Repository shape as received

The project was delivered as two ZIP files at the repo root:

- `sesli-makale-asistanı.zip` (md5 `c477d6fd…`)
- `sesli-makale-asistanı (1).zip` (md5 `34318b22…`)

The MD5 hashes differ, but the **file inventory is identical** (same 23 files, same byte sizes; only the zip timestamps and internal ordering differ — 22:06 vs 22:08). They are duplicate snapshots, **not** two different workspaces. One copy was extracted into the working directory; both archives were moved to `_zip_archive/` to avoid a duplicate workspace.

## 1. Baseline command results

| Command | Result |
|---|---|
| `npm install` | OK — 309 packages, 0 vulnerabilities |
| `npm run lint` (`tsc --noEmit`) | **PASS** (exit 0, no type errors) |
| `npm run build` (`vite build` + `esbuild server.ts`) | **PASS** — `dist/index.html`, `index.js` 315.58 kB (gzip 92.79 kB), `dist/server.cjs` 13.9 kB |
| test command | **None exists** (`package.json` has no `test` script) |

The prototype compiles and builds cleanly. There is **no critical build blocker**, so per CLAUDE.md §5.1 the existing React + TypeScript + Vite + Express stack is preserved; no stack migration.

## 2. Stack as verified

- React 19.0.1, TypeScript 5.8, Vite 6, Tailwind CSS 4 (`@tailwindcss/vite`), `lucide-react`, `motion`.
- Express 4 dev/prod server (`server.ts`) that also mounts Vite in middleware mode for dev.
- `@google/genai` 1.29 for Gemini, called **server-side only** (good).
- Dev script runs the Express server via `tsx server.ts` (not bare `vite`), so the API and the app share one origin/port (3000).

## 3. File inventory & sizes

| File | Lines (approx) | Role |
|---|---|---|
| `src/App.tsx` | ~1342 | Monolithic root: state, persistence, parsing orchestration, translation, notes CRUD, library, note playback, virtual-voice injection |
| `src/hooks/useSpeechEngine.ts` | ~1160 | TTS engine, voice ranking, STT/dictation, hands-free commands, graph-approval flow |
| `src/utils/documentParser.ts` | ~830 | PDF/DOCX/TXT parsing, two-column reconstruction, heading/graph detection, header/footer cleaning, language detect |
| `src/components/ReaderPanel.tsx` | ~1000 | Reader viewport, highlighting, click-to-read, translation UI, graph approval UI |
| `src/components/SpeechRecordingModal.tsx` | ~700 | Note dictation modal + Gemini "debate" tab |
| `src/components/NotesPanel.tsx` | ~289 | Notes list, search, edit/delete, copy, TXT download |
| `src/components/Navbar.tsx` | ~225 | Voice/speed selectors (duplicate voice ranking), hands-free toggle |
| `server.ts` | ~296 | 4 Gemini endpoints + Vite/static middleware |
| `src/types.ts` | ~66 | `Article`, `Note`, `ParsedLine`, `AppVoice`, `SpeechSettings` |

## 4. Behavior that MUST be preserved (valuable working features)

1. PDF/DOCX/TXT upload and parsing with page awareness.
2. `.doc` rejection with a clear Turkish message (already correct in parser).
3. Page / paragraph / sentence segmentation; conservative heading detection; figure/table caption detection.
4. Header/footer/noise removal (page numbers, DOI lines, copyright/publisher boilerplate).
5. Experimental two-column PDF reconstruction (15-step split-point search).
6. Language detection (tr/en/de/fr/es/it via stopword frequency).
7. Browser TTS with active-sentence highlighting, click-to-read, play/pause/prev/next, speed/voice change mid-read, last-position persistence.
8. Hands-free voice commands (multi-language trigger phrases).
9. Typed + dictated notes linked to page/line + the active sentence text.
10. Note edit/delete/search/playback/copy/TXT export; per-article renumbering.
11. Local library/archive with serial numbers and note garbage-collection on delete.
12. Gemini translation to Turkish (batch, page-range, original preserved).
13. Gemini contextual discussion ("debate") scoped to the read passage.
14. Sample Turkish article.
15. Server endpoints for translate-text, translate-batch, debate.

## 5. Problems found (mapped to CLAUDE.md §27)

### 5.1 Critical — misleading / trust-damaging behavior

- **Fabricated graph trends (server + client).** `server.ts:78-80` fallback **invents** an upward trend / efficiency increase ("dikey grafiksel ivmelenmeyle kanıtlanmıştır", "steady upward trend in efficiency") from only a title. The client has a matching fabricated fallback. Violates §14.6 — must be removed.
- **Fake "premium / AI" virtual voices.** `useSpeechEngine.ts` (and mirrored in `App.tsx`) injects 4 invented voices — `virtual:tr:tolga/cem/dilara/yelda`, labeled "Yapay Zeka … (Premium / Doğal)" — that are just pitch/rate tunings of one native Turkish voice. Voice ranking even adds +300 for the names `tolga/cem/dilara`. Violates §9.2.
- **"Premium" star + guaranteed-voice copy.** `Navbar.tsx:152-176` flags voices with a 🌟 and gender labels using name heuristics; comment "ensure zero truncation of premium voices". Implies guarantees the browser cannot make.

### 5.2 High — architecture & data

- **Monolithic files.** `App.tsx` ~1342 lines with 40+ handlers and 32 props drilled into `ReaderPanel`; `useSpeechEngine` ~1160 lines mixing TTS + STT + hands-free + graph flow.
- **localStorage stores entire parsed documents.** Keys `sesli_makale_aktif`, `sesli_makale_notlar`, `sesli_makale_arsiv` hold whole `Article` objects (all pages/lines) + original+translated copies — will blow the ~5 MB quota on real PDFs. Needs IndexedDB (§5.3).
- **Notes anchored only to page/line + current sentence text.** No exact text selection, no stable segment ID, no offset/context, single `noteText` field (no raw/cleaned/final separation). Violates §6, §11.
- **Duplicated voice-ranking logic** in `useSpeechEngine.ts` and `Navbar.tsx` (identical scoring); duplicated STT `onresult` handler and locale map inside the hook.

### 5.3 Medium

- **CDN dependency for core parsers.** `index.html` loads `pdf.js@3.11.174` and `mammoth@1.6.0` from cdnjs as `window.pdfjsLib` / `window.mammoth`; the PDF worker is also a hard-coded cdnjs URL. No offline/locked-version guarantee. Violates §7.2/§12-CDN concern.
- **No scanned/image-only PDF detection.** Empty text yields silent empty pages (§7.3).
- **Hardcoded model name.** `gemini-3.5-flash` is hardcoded in all 4 server endpoints; should read `GEMINI_MODEL` from config with a default (§14.1).
- **No request validation / rate limiting / body-size limits / timeouts** on AI endpoints (§14.2, §21). `express.json()` with default limit; no Zod.
- **Duplicate speed options** in `Navbar.tsx:196-203` — both `value="1"` and `value="1.0"`, both `value="2"` and `value="2.0"` (§9.2).
- **AI Studio placeholder branding.** `README.md` is the AI Studio template; `.env.example` references `MY_GEMINI_API_KEY` / `APP_URL`, not the variables CLAUDE.md specifies (§14.1, §27.11).
- **Port hardcoded** to `3000` in `server.ts` (should read `PORT`).
- **No tests** of any kind (§19).

### 5.4 Low / copy issues

- Mixed Turkish/English labels ("Note Voice Language"), subjective marketing ("Süper akıcı … dil modeli", "zero truncation").
- `.doc` is in the `Article.fileType` union and the file-input `accept` list while the parser rejects it — type/UX mismatch (§27.7).
- Graph summary mutates `line.graphSummary` as a side effect during playback.

## 6. Secrets / safety check

- No real API key is committed. `.env.example` holds placeholders only; `.gitignore` already ignores `.env*` except `.env.example`. No `.env`/`.env.local` present in the extracted tree (must not be created/overwritten).
- Gemini key is used **server-side only** — no key reaches the client bundle. Good and must stay this way.

## 7. Audit conclusion

The prototype is genuinely useful and builds cleanly; it should be **stabilized and completed, not rewritten**. The work is: (1) remove the three trust-damaging behaviors (fabricated graphs, fake premium voices, premium-voice guarantees) early; (2) move persistence to IndexedDB with a non-destructive migration; (3) introduce the real source-linked `ResearchNote` data model and exact text selection; (4) localize parsers off the CDN; (5) harden the AI server; (6) add export (Markdown/DOCX) and a test suite. Proceeding into Phase 1 per the plan.
