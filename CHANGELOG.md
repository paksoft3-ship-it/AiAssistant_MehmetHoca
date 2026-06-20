# Changelog

All notable changes to EidosUs (Academic Active Reading Assistant). Updated after every implementation phase.

## [Unreleased]

### Phase 0 — Audit & baseline (2026-06-21)
- Extracted a single workspace from the two duplicate delivery ZIPs (identical file inventory; differing only in zip timestamps). Archived both zips under `_zip_archive/`.
- Verified baseline: `npm install` (0 vulnerabilities), `npm run lint` (tsc — pass), `npm run build` (vite + esbuild — pass). No test script exists yet.
- Confirmed the existing React + TypeScript + Vite + Express stack has no critical blocker; **no stack migration** (per CLAUDE.md §5.1).
- Authored baseline docs: `CURRENT_STATE_AUDIT.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `DATA_MODEL.md`, `KNOWN_LIMITATIONS.md`, `PRIVACY_AND_DATA_FLOW.md`, `MANUAL_TEST_CHECKLIST.md`, and this changelog.
- Catalogued behavior to preserve and trust/architecture problems to fix (fabricated graph trends, fake "premium" virtual voices, premium-voice guarantees, monolithic files, localStorage storing full documents, page/line-only note anchoring, CDN parser dependency, unhardened AI endpoints, duplicate speed options, no tests).
- Initialized git and created a baseline commit (excludes secrets, build output, and the delivery zips).
