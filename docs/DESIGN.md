# EidosUs — Design System (design.md)

The visual + interaction contract for EidosUs. Use it to (1) brief Stitch consistently and (2) implement the returned designs against fixed tokens. Aligns with CLAUDE.md §16–17.

---

## 1. Brand & principles

**Product:** EidosUs — *Akademik Sesli Okuma ve Kaynak Bağlantılı Not Asistanı* (Academic Active Reading Assistant).

**Design DNA:** Calm · Academic · Trustworthy · Premium-but-not-luxurious · Modern · High-readability · Minimal distraction.

**It is NOT:** a playful student app, a gamified planner, or a flashy "AI sparkle" product. No neon gradients, no cartoon mascots, no dense dashboards.

**Honesty in UI (hard rules):**
- No fake "premium/AI" voice badges, no ⭐ on voices, no invented gender/persona labels.
- No "100% offline" / "fully private" / "guaranteed voice" claims.
- No fabricated figure/graph trends; figure explanation is clearly labeled AI interpretation.
- No fake testimonials, user counts, or university logos on the landing page.

**Voice & tone:** Professional, concise, academic Turkish. Encouraging but not hyped.

---

## 2. Color tokens

Use these exact hex values. Two themes (light default, dark supported).

### Light (default)
| Token | Hex | Use |
|---|---|---|
| `canvas` | `#FAFAF9` | App background (warm off-white) |
| `surface` | `#FFFFFF` | Cards, panels, modals |
| `surface-muted` | `#F4F5F7` | Subtle fills, inputs, hover |
| `border` | `#E6E7EB` | Hairline borders, dividers |
| `heading` | `#1B2A4A` | Deep navy — titles, headings |
| `text` | `#334155` | Body text |
| `text-muted` | `#64748B` | Secondary/meta text |
| `primary` | `#4F46E5` | Primary actions (muted indigo) |
| `primary-hover` | `#4338CA` | Primary hover |
| `primary-soft` | `#EEF2FF` | Primary tints, active chips |
| `success` | `#059669` | Success/save states (emerald) |
| `success-soft` | `#ECFDF5` | Success tint |
| `warning` | `#D97706` | Warnings (amber) |
| `warning-soft` | `#FFFBEB` | Warning tint |
| `danger` | `#DC2626` | Destructive + recording (red) |
| `danger-soft` | `#FEF2F2` | Danger tint |
| `focus-ring` | `#6366F1` | Keyboard focus outline |

### Dark
| Token | Hex |
|---|---|
| `canvas` | `#0B1120` |
| `surface` | `#0F172A` |
| `surface-muted` | `#1E293B` |
| `border` | `#1E293B` |
| `heading` | `#F1F5F9` |
| `text` | `#CBD5E1` |
| `text-muted` | `#94A3B8` |
| `primary` | `#6366F1` |
| `primary-soft` | `rgba(99,102,241,0.15)` |

**Usage rules:** Red is reserved for destructive actions and the active recording/listening state only. Emerald only for genuine success. Amber only for honest warnings/limitations. Indigo carries all normal primary actions.

---

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| UI / interface | **Inter** (system-ui fallback) | All chrome, labels, buttons |
| Reading area | **Newsreader** (serif; Source Serif 4 / Georgia fallback) | ONLY inside the document reading text |
| Mono / metadata | **IBM Plex Mono** (ui-monospace fallback) | Page/line numbers, timestamps, technical meta |

**Scale (px / line-height):**
- Display `32/40` bold — landing hero
- H1 `24/32` bold — page titles
- H2 `20/28` bold — section titles
- H3 `16/24` bold — card titles
- Body `15/24` — UI text
- Reading body `17/30` serif — document text (max line length ~70ch)
- Small `13/20` — secondary
- Micro `11/16` mono/uppercase tracking-wide — labels, meta

Comfortable line-height, generous reading width, never full-bleed walls of text.

---

## 4. Spacing, radius, elevation

- **Spacing:** 4-pt base (4, 8, 12, 16, 20, 24, 32, 48, 64).
- **Radius:** sm `8`, md `12`, lg `16`, xl `20`, 2xl `24`, pill `full`. Cards/panels use `16–24`; buttons/inputs `12`; chips `full`.
- **Shadows (soft, never heavy):**
  - `xs` `0 1px 2px rgba(15,23,42,.04)`
  - `sm` `0 2px 8px rgba(15,23,42,.06)`
  - `md` `0 8px 24px rgba(15,23,42,.08)` (modals/popovers)
- **Borders:** prefer 1px hairlines over heavy shadows for separation.

---

## 5. Layout

**Desktop (≥1024px) reader workspace — 3 zones:**
- **Top app bar** (sticky, 64px): product mark + current document title · playback controls · voice + speed · privacy/status.
- **Center reading panel** (≈58–66% width): page tabs + in-document search + reading-progress bar; document text with active-segment highlight + selection action bar.
- **Right notes rail** (≈34–42% width): research notes (search, tag filter, sort, export).
- Optional left outline/pages strip may be folded into the page tabs for the MVP.

**Mobile (<1024px):** single column. A segmented tab switch toggles **Okuma (Reader)** vs **Notlar (Notes)**. Playback and "Not Al" must stay reachable (sticky bottom area). Never force 3 columns.

**Landing/dashboard:** centered max-width ~960–1040px, vertical sections with calm spacing.

---

## 6. Core components

- **Buttons:** Primary (indigo solid, white text), Secondary (surface + border), Ghost (text only), Danger (red, destructive), Recording (red, pulsing dot when active). Height 36–44, radius 12, bold 13–14.
- **Inputs / textarea / select:** surface bg, 1px border, radius 12, focus ring indigo, clear labels (micro uppercase).
- **Cards / panels:** surface, 1px border, radius 16–24, shadow xs–sm.
- **Tags/chips:** pill, surface-muted; active = primary-soft / primary text. Tag chips show a small tag icon.
- **Toolbar (reader):** compact row — search input (left, grows), match counter + up/down, then a thin progress bar with "% read".
- **Active segment highlight:** indigo-soft background + 4px indigo left border; serif text; smooth scroll into view.
- **Selection action bar:** floating pill over the reading panel showing the quoted selection + "Bu Metne Not Ekle".
- **Note card:** number badge `#n` · page link `Sayfa N ↗` · origin chip (Sesli/Yazılı) · optional "Düzenlendi" (AI-cleaned) chip · source excerpt (italic, left-bordered) · final note · tag chips · actions (Dinle / Düzenle / Sil with inline confirm).
- **Note editor (modal):** source excerpt card → dictation row (mic toggle + language pills + honest STT note) → "Ham Döküm" textarea → "Akademik Olarak Düzenle" (violet, optional) → "Düzenlenmiş Akademik Not" textarea → tags input → footer (İptal / Notu Kaydet).
- **Export dialog:** format cards (Markdown / Word DOCX / TXT) → content checkboxes (kaynak pasajları, ham dökümler, etiketler) → order toggle (Kaynak sırası / Eklenme) → "yalnızca seçili notlar" with picker → footer count + Dışa Aktar.
- **Voice/speed selectors:** plain voice name + language only (no badges); speed options 0.75–2.0 with no duplicates; honest tooltip "cihazınızdaki seslere bağlıdır".
- **Privacy modal:** three honest sections (Yerel depolama / Sesli okuma & ses tanıma / Yapay zeka) + "Verilerimi Sil".
- **Empty / loading / error states:** calm centered icon + short Turkish copy. Parsing = circular progress + %; error = red-soft card with cause + what to do.

---

## 7. Iconography & motion

- **Icons:** Lucide, 1.5–2px stroke, slate tone, never decorative "sparkles everywhere".
- **Motion:** subtle (150–240ms ease), fade/scale for modals, smooth scroll to active segment. Pulse ONLY on the active recording indicator. Respect `prefers-reduced-motion`.

---

## 8. Accessibility

- WCAG AA contrast for text and UI.
- Visible keyboard focus (indigo ring) on every interactive element.
- Semantic buttons/labels; ARIA for playback/recording state and progress.
- Recording, listening, processing, and error states announced to screen readers.
- Reading area: adjustable nothing fake, but high legibility; target ~17px serif.

---

## 9. Screen inventory (maps to Stitch prompts)

1. **Landing / Marketing dashboard** (desktop + mobile)
2. **Reader workspace** (desktop 3-pane)
3. **Note editor modal**
4. **Research notes rail** (component focus)
5. **Export dialog**
6. **Privacy notice modal**
7. **Document library section** (filters/sort)
8. **Mobile reader + notes (tabbed)**
9. **States:** upload/parsing, empty notes, unsupported file / scanned PDF / AI-unavailable errors

See `docs/STITCH_PROMPTS.md` for ready-to-paste prompts.
