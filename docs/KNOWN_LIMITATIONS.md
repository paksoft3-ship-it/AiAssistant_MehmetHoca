# KNOWN LIMITATIONS — EidosUs

Honest, user-facing limitations. Kept current as the MVP evolves. The product's rule is: **an honest limitation message beats fabricated output.**

## Parsing
- **No OCR.** Scanned / image-only PDFs produce little or no text. The app detects this and says so; it does not OCR.
- **Two-column reconstruction is heuristic.** Confidence-based; falls back to single-column order when unsure. Complex layouts (3+ columns, tables, marginalia) may read out of order.
- **Metadata inference (title/authors/DOI/year) is best-effort** and editable by the user; failures never block upload.
- **Legacy `.doc` is unsupported** by design. Users are asked to save as `.docx` or `.pdf`.

## Text-to-speech (Web Speech API)
- **Voice availability depends on the browser and OS.** The app cannot guarantee any specific voice (no guaranteed Google/Siri/Microsoft/"premium" voices). It ranks whatever the device exposes.
- There are **no invented "AI/premium" voices**; the prototype's fabricated `virtual:*` voices are removed.
- Some browsers cut off long utterances; the engine reads segment-by-segment to mitigate this.
- Mobile browsers require a user gesture before audio can start.

## Speech recognition / dictation
- **Not guaranteed local or offline.** Some browsers (notably Chrome) process speech via online vendor services. This is stated in the UI.
- Recognition can stop after silence; restart is controlled and capped (no infinite loops). Transcripts are preserved across unexpected session ends.
- Availability varies by browser; where unavailable, typed notes are the fallback.

## AI features (Gemini)
- Require a configured server-side `GEMINI_API_KEY`. With no key, the app **still reads and saves notes locally**; AI actions degrade gracefully and say they are unavailable (they do **not** fabricate output).
- **Note cleaning** improves grammar/clarity only; it must not invent evidence, citations, or certainty. Unclear transcripts return a warning.
- **Figure/graph explanation** uses only the caption + surrounding extracted text, is labeled an AI interpretation, and is gated behind a feature flag. It never claims trends/values it cannot see.
- **Translation** is AI-generated, marked as such, and never overwrites the original.

## Storage / privacy
- Data is stored **locally in the browser (IndexedDB)**. Clearing browser data deletes it unless exported. No cloud sync in the MVP.
- IndexedDB has quota limits; very large documents may fail to store, with a clear error.

## Not in the MVP
Native apps, payments, OCR, real-time collaboration, citation-manager/Zotero integration, Pomodoro/calendar/flashcards, analytics. Extension points exist but are intentionally not implemented.
