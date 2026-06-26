# Accessibility Audit — EidosUs (Beta)

Status as of Beta Phase 7 (2026-06-26). Scope: WCAG 2.1 AA orientation, not a
formal certification. Core reading and note-taking remain free in accessibility
mode (Beta spec §27) — no toggle gates functionality.

## Implemented

- **Skip link** ("İçeriğe geç") to `#main-content` on both home and reader.
- **Accessibility mode panel** with persisted preferences:
  - High contrast (stronger borders + text contrast)
  - Large text (root font scaled; rem-based sizing follows)
  - Reduced motion (disables animations/transitions; also honours
    `prefers-reduced-motion`)
  - Spoken interface hints / auto-describe figures (flags; wired to TTS/figure flows)
- **Dialog semantics**: modals use `role="dialog"` + `aria-modal`; the How It
  Works / Standby dialogs move focus in on open, restore it on close, and close on Esc.
- **Landmarks & headings**: `<main>` landmark with id; section headings; ordered
  lists for steps/timeline.
- **Labels**: icon-only controls have `aria-label`/`title`; the reading progress
  bar and Continue-Reading card use `role="progressbar"` with values.
- **Honest TTS/STT copy**: no "fully offline"/"guaranteed voice" claims; the
  Standby overlay states its page-open-only limitation.

## Known gaps / follow-ups

- No automated `axe` run wired into CI yet — recommended next (Beta spec §36).
- Focus-trap inside modals is partial (focus is moved in + Esc closes; Tab is not
  fully cycled within every dialog).
- The reader's active-sentence highlight is visual; a polite ARIA live region for
  the current sentence would help screen-reader users.
- Color-contrast tokens should be verified against AA ratios in high-contrast mode
  with a contrast checker.
- Full keyboard operation of the voice-note recording flow needs manual testing
  across browsers.

## How to test manually

1. Tab from page load → the skip link appears first and jumps to content.
2. Open Erişilebilirlik → enable mode + each toggle; verify text scales, motion
   stops, contrast increases, and the choices persist across reload.
3. Navigate modals with keyboard only (Esc closes; focus returns to trigger).
4. Run a screen reader (VoiceOver/NVDA) over home + reader; confirm headings,
   buttons, and dialogs are announced.
