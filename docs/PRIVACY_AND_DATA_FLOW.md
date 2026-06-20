# PRIVACY & DATA FLOW — EidosUs

This document states truthfully where data goes. It backs the in-app privacy notice (CLAUDE.md §17).

## Where data lives
- **Documents, parsed pages/segments, notes, discussions, translations, export records, and (when practical) the original file blob** are stored **locally in your browser** using IndexedDB.
- **Small preferences** (theme, selected voice, playback speed, last opened document, feature flags) are stored in `localStorage`.
- **Nothing is uploaded to our server for storage.** The server is a stateless proxy to the AI provider.

## What leaves the browser, and when
| Action | Leaves browser? | Sent where | What is sent |
|---|---|---|---|
| Upload / parse a document | No | — | Parsing happens fully in-browser (pdfjs-dist / mammoth) |
| Read aloud (TTS) | Depends on OS voice | OS/browser voice engine | The text being spoken (handled by the browser, not us) |
| Dictate a note (STT) | **Maybe** | Browser/vendor speech service | Audio/transcript — some browsers process this online; this is disclosed in the UI |
| Clean a note (AI) | Yes | Our server → Gemini | The source excerpt + your raw transcript + document title |
| Translate | Yes | Our server → Gemini | The selected page/text |
| Discussion ("debate") | Yes | Our server → Gemini | The excerpt, nearby context, and your messages |
| Figure explanation | Yes | Our server → Gemini | The figure caption + surrounding text |
| Export | No | — | File generated in-browser and downloaded |

AI features send **only the required text/context**, never your whole library. You can use the app fully (read + notes + export) **without ever triggering an AI feature**.

## Secrets
- The `GEMINI_API_KEY` lives **only on the server**, read from environment variables. It never appears in the client bundle or repository.
- Server logs do **not** include full document text or raw microphone audio.

## Your controls
- **"Verilerimi Sil"** in Settings permanently deletes local data after a strong confirmation.
- Export your notes (Markdown/DOCX/TXT) at any time to back them up before clearing browser data.
- AI features are optional and can be left unused.

## Honesty rules (enforced in copy)
- We do **not** claim "100% offline" or "fully private" for features that may use online services (STT, AI).
- We do **not** claim guaranteed premium/AI voices.
- We do **not** fabricate figure/graph findings.
