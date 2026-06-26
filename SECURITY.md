# Security Policy

## Reporting a vulnerability

Please report security issues privately to **hilalahmad.civilengineer@gmail.com**
rather than opening a public issue. Include steps to reproduce and the affected
version/commit. We aim to acknowledge reports promptly and will coordinate a fix
before public disclosure.

## Security posture

- **Secrets stay server-side.** The Gemini API key is read from the server
  environment only; it never reaches the client bundle.
- **Input validation.** API requests are validated with Zod; bodies are
  size-limited and AI/import endpoints are rate-limited.
- **SSRF protection (URL import).** `POST /api/import/url` only accepts http(s),
  blocks `localhost`/internal hostnames and private/loopback/link-local IPs
  (IPv4 + IPv6, including IPv4-mapped), re-validates the host at every redirect
  hop, enforces a timeout, caps body size, and restricts content types. See
  `server/services/import/urlGuard.ts` (unit-tested).
- **Local-first storage.** Documents and notes live in the browser (IndexedDB);
  they are not uploaded to a server except the specific text sent to the AI
  service when the user invokes an AI feature.
- **Privacy-safe logging.** The server logs sizes/domains/outcomes, never
  document or note content, and never raw audio.
- **No unsafe HTML.** AI/document content is not rendered via
  `dangerouslySetInnerHTML`; imported HTML is extracted with Readability
  server-side (scripts/forms stripped).

## Out of scope (documented limitations)

- Web Speech TTS/STT behavior depends on the browser/OS and may use online
  vendor services; we do not claim fully-offline speech.
- Background/locked-screen wake-word is not provided on the web (see
  `docs/NATIVE_APP_ROADMAP.md`).
