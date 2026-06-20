# MANUAL TEST CHECKLIST — EidosUs

Browser-dependent features (TTS/STT, IndexedDB persistence across reload) must be verified by hand. Automated tests mock the Web Speech APIs. Mark each item Pass/Fail with browser + OS.

## Priority browsers
Chrome desktop · Edge desktop · Safari desktop · Chrome Android · Safari iOS (document limitations).

## Core workflow (must pass before beta)
- [ ] Upload a TXT fixture → parses → readable segments shown.
- [ ] Upload a single-column PDF → page-aware segments, correct order.
- [ ] Upload a two-column PDF → reading order is left-column-then-right (or safe fallback).
- [ ] Upload a DOCX → parses to segments.
- [ ] Upload a `.doc` → shows the Turkish "save as .docx/.pdf" message, no crash.
- [ ] Upload a scanned/image-only PDF → shows the "taranmış / OCR desteklenmiyor" message.
- [ ] Press play → TTS reads; active segment is highlighted.
- [ ] Click a segment → reading starts from it.
- [ ] Pause / resume / previous / next work.
- [ ] Change voice and speed mid-read → continues from current segment, not the start.
- [ ] Select an exact excerpt → "Bu Metne Not Ekle" → source anchor shows the selected text.
- [ ] With nothing selected → note uses the active spoken segment as anchor.
- [ ] Dictate a note (where supported) → interim transcript shows; final raw transcript preserved.
- [ ] Type a note → save without AI.
- [ ] Request "Akademik Olarak Düzenle" → cleaned note appears; raw transcript unchanged; works only if AI configured.
- [ ] With AI unavailable → cleaning fails gracefully; note still saves.
- [ ] Edit final note → save → persists.
- [ ] Note card shows source excerpt, page, tags, time, origin.
- [ ] Click a note's source → reader jumps back and temporarily highlights it.
- [ ] Reload browser → document, notes, and reading position survive (IndexedDB).
- [ ] Existing localStorage prototype data → migrated into IndexedDB on first load; old keys retained.
- [ ] Export Markdown → structured file downloads.
- [ ] Export DOCX → opens in Word/Pages.
- [ ] Export TXT → backward-compatible.
- [ ] "Verilerimi Sil" → strong confirm → local data cleared.

## Secondary features
- [ ] Translate to Turkish → original preserved, toggle works, marked AI-generated.
- [ ] Discussion ("debate") scoped to excerpt; convert insight to a note.
- [ ] Hands-free command pauses TTS and opens note capture; can be disabled; mic indicator visible.
- [ ] Figure explanation (flagged): no fabricated trends; labeled AI interpretation; honest message when only caption is available.

## Trust / copy
- [ ] No 🌟"premium"/fake "Yapay Zeka" virtual voices in the voice list.
- [ ] Speed dropdown has no duplicate 1.0x / 2.0x entries.
- [ ] No "100% offline" / "guaranteed voice" / "zero error" copy.
- [ ] No API key visible in the built client bundle (`grep` dist).

## Accessibility / responsive
- [ ] Keyboard navigation + visible focus.
- [ ] ARIA on recording/playback states.
- [ ] Mobile: play/pause and "Not Al" reachable; not forced into 3 columns.
- [ ] Reduced-motion respected.
