# Beta Test Checklist (manual)

Run through these on Chrome desktop + at least one mobile viewport (360–390px).
Web Speech (TTS/STT) must be tested manually — it is browser/OS dependent.

## Core reading & notes
- [ ] Upload a PDF / DOCX / TXT → parses and opens in the reader.
- [ ] `.doc` upload → clear "convert to .docx/.pdf" message (no false support).
- [ ] Play/pause/next/prev; active sentence highlights; speed/voice change mid-read.
- [ ] Select text → "note" → raw transcript preserved → save → appears in panel.
- [ ] Type a note without AI; optionally "Akademik Olarak Düzenle" (AI clean).
- [ ] Tag quick-add chips + tag filter/search/sort in the notes panel.
- [ ] Jump-to-source from a note returns to the right place.

## Navigation (Phase 1)
- [ ] Browser Back from reader returns home (does not leave the site).
- [ ] "Ana Sayfa" button + clickable brand return home; doc/notes/position kept.
- [ ] Leaving while recording a note prompts before discarding.
- [ ] "Nasıl Çalışır?" opens; "Sesli Dinle" reads the steps aloud.
- [ ] "Okumaya Devam Et" card resumes the last started document.

## Import (Phase 4)
- [ ] Import a public article URL → readable paragraphs; domain shown on the card.
- [ ] Import a public PDF URL → parses.
- [ ] A `localhost`/private-IP/`file:` URL is rejected with a clear message.

## Export (Phase 3)
- [ ] Export Markdown / DOCX / TXT / CSV / XLSX; field toggles respected.
- [ ] CSV opens in Excel with correct Turkish characters; XLSX opens cleanly.

## Projects / History / Invite (Phase 5)
- [ ] Create a project, assign a document, filter the library by project, delete a project (docs kept).
- [ ] History timeline shows uploads/imports/notes/exports; "Geçmişi Temizle" works.
- [ ] Invite: copy link, e-mail (mailto), WhatsApp, native share (mobile).

## Assistant / Standby (Phase 6)
- [ ] Set assistant name → used as wake phrase; toggles persist across reload.
- [ ] Standby overlay shows status + exits; limitation copy is visible.

## Accessibility (Phase 7)
- [ ] Tab on load → skip link appears and jumps to content.
- [ ] Accessibility mode: large text / high contrast / reduced motion apply and persist.
- [ ] Modals close on Esc and return focus to the trigger.

## Resilience / privacy
- [ ] With no `GEMINI_API_KEY`, reading + notes + export still work; AI degrades gracefully.
- [ ] Reload → documents, notes, reading position persist (IndexedDB).
- [ ] Privacy notice is accurate; "Verilerimi Sil" clears local data.
- [ ] No API key appears in the built client bundle.
