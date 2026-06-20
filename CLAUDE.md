# Claude Code Master Prompt
## EidosUs / Sesli Makale Asistanı — Academic Active Reading and Source-Linked Note Assistant

You are Claude Code working inside the root directory of an existing local project. Your job is to audit, refactor, complete, test, and document this project as a production-minded MVP/Beta for real users.

Do not treat this as a blank greenfield project. There is already a working prototype. Preserve the valuable working behavior, remove misleading or unsafe behavior, improve the architecture, and complete the core commercial workflow.

---

# 1. Product Background

The product began as a web-based document reader that could read uploaded documents aloud and let users take notes while listening. The product direction has now been narrowed and clarified.

The correct product is not a generic “study companion,” a generic PDF summarizer, or another AI chatbot for documents.

The product is:

> An academic active-reading assistant for graduate students, PhD students, researchers, academics, and other people who read long academic documents and need to capture their own thinking while reading or listening.

The main value proposition is:

> Upload an academic paper, listen to it, pause at any point, speak or type a thought, connect that thought to the exact source passage, clean it into a structured academic note, and export the research notes for later writing.

The essential workflow is:

> Upload document → parse document → read/listen → select or identify source passage → record/type note → preserve raw transcript → optionally create AI-cleaned note → edit final note → save with exact source context → export structured research notes.

The product must feel like a serious research workflow tool, not a playful student productivity application.

Working product name:

- Public working name: **EidosUs**
- Descriptive subtitle: **Academic Active Reading Assistant**
- Turkish descriptive name: **Akademik Sesli Okuma ve Kaynak Bağlantılı Not Asistanı**

Keep the brand name in a single configuration/constants file so it can be renamed later without editing many components.

Primary UI language for the MVP: **Turkish**.

Architecture must make future English localization possible, but full i18n is not required before the core MVP is stable.

---

# 2. Current Codebase — What Already Exists

Before changing anything, inspect the entire repository and verify all of the following against the real code.

The uploaded prototype currently appears to use:

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Lucide React icons
- Motion
- Express server
- Google Gemini through `@google/genai`
- Browser Web Speech API:
  - `window.speechSynthesis` for TTS
  - `webkitSpeechRecognition` / SpeechRecognition for voice commands and dictation
- Browser `localStorage` for persistence
- PDF.js loaded through browser/CDN logic
- Mammoth.js loaded through browser/CDN logic

Current important files include:

- `src/App.tsx`
- `src/types.ts`
- `src/hooks/useSpeechEngine.ts`
- `src/utils/documentParser.ts`
- `src/components/Navbar.tsx`
- `src/components/ReaderPanel.tsx`
- `src/components/NotesPanel.tsx`
- `src/components/SpeechRecordingModal.tsx`
- `server.ts`

The current application already contains or attempts to contain:

1. PDF, DOCX, and TXT upload and parsing.
2. Old `.doc` rejection with an instruction to convert to DOCX or PDF.
3. Page, paragraph, sentence, and line-level document segmentation.
4. Basic academic heading detection.
5. Header/footer/noise removal.
6. Experimental two-column PDF reconstruction.
7. Language detection.
8. Graph/table/figure heading detection.
9. Browser text-to-speech.
10. Active sentence highlighting.
11. Start reading from a clicked sentence.
12. Play, pause, resume, previous, and next controls.
13. Reading-speed and voice changes while reading.
14. Last reading-position persistence.
15. Voice sorting by names such as Neural, Natural, Premium, Google, Siri, Microsoft, Enhanced, etc.
16. Hands-free voice commands in several languages.
17. Typed and dictated notes.
18. Notes linked to the current page, line, and sentence.
19. Note edit, delete, search, playback, copy, and TXT download.
20. A local document library.
21. Gemini translation to Turkish.
22. Gemini contextual discussion/debate mode.
23. Experimental Gemini graph explanations.
24. A sample Turkish article.
25. Express endpoints for translation, discussion, and graph explanation.

The existing prototype is useful and should not be discarded without a strong technical reason.

---

# 3. Critical Product Principle

The core product is not:

- “Upload a PDF and chat with it.”
- “Upload a PDF and receive a summary.”
- A Pomodoro application.
- A calendar application.
- A generic student planner.
- A citation manager replacement.
- A social network.

The product wins or loses based on the quality of this one workflow:

> Exact source passage → user thought → raw transcript → cleaned academic note → editable final note → structured export.

Do not allow secondary AI features to delay or damage this core workflow.

Translation, AI discussion, hands-free commands, and figure explanation are secondary/experimental features. Preserve them behind clean boundaries or feature flags, but prioritize the source-linked note workflow first.

---

# 4. Your First Actions — Mandatory Repository Audit

Do not immediately rewrite the project.

First perform the following audit:

1. Read every source file in the repository.
2. Inspect `package.json`, scripts, TypeScript configuration, Vite configuration, server code, environment examples, and all components.
3. Run:
   - `npm install` if required
   - `npm run lint`
   - `npm run build`
   - the available test command if one exists
4. Record all current compile errors, runtime risks, duplicated logic, unused code, unsafe fallbacks, and architectural problems.
5. Identify all current behavior that must be preserved.
6. Check whether both uploaded ZIP versions are duplicates; do not create duplicate workspaces.
7. Create these files before major implementation:
   - `docs/CURRENT_STATE_AUDIT.md`
   - `docs/IMPLEMENTATION_PLAN.md`
   - `docs/ARCHITECTURE.md`
   - `docs/KNOWN_LIMITATIONS.md`
   - `CHANGELOG.md`
8. Make a safe baseline Git commit if the folder is a Git repository. If it is not a Git repository, initialize Git and create a baseline commit, but do not commit `.env` files, API keys, build output, or large uploaded documents.
9. Do not overwrite the existing `.env.local` or `.env` file.
10. Do not delete a working feature until its replacement is implemented and tested.

After the audit, proceed with implementation without repeatedly asking for confirmation. Only stop and ask a question if a missing secret, external account, or fundamentally ambiguous requirement makes progress impossible.

---

# 5. Technical Direction

## 5.1 Preserve the existing stack for the MVP

Use the existing React + TypeScript + Vite + Express stack unless the audit finds a critical blocker.

Do not migrate the application to Next.js merely for fashion or preference. A stack migration is not part of the product value and would add risk.

## 5.2 Refactor feature-by-feature

The current code has very large files. Refactor without changing behavior unexpectedly.

Target feature-oriented structure:

```text
src/
  app/
    App.tsx
    routes.tsx
    providers/
  config/
    product.ts
    featureFlags.ts
  components/
    ui/
    layout/
  features/
    documents/
      components/
      hooks/
      services/
      types/
    reader/
      components/
      hooks/
      services/
      types/
    speech/
      components/
      hooks/
      services/
      types/
    notes/
      components/
      hooks/
      services/
      types/
    library/
      components/
      hooks/
      services/
    export/
      services/
      templates/
    translation/
    discussion/
    figures/
  db/
    database.ts
    migrations.ts
    repositories/
  lib/
    apiClient.ts
    errors.ts
    logger.ts
    ids.ts
  pages/
    LandingPage.tsx
    LibraryPage.tsx
    ReaderPage.tsx
    SettingsPage.tsx
  types/
  utils/
server/
  index.ts
  config.ts
  middleware/
  routes/
    aiNotes.ts
    discussion.ts
    translation.ts
    figures.ts
  services/
    geminiClient.ts
    prompts/
  schemas/
```

This structure is a target, not an excuse for a destructive rewrite. Move code incrementally.

## 5.3 Persistence

The current application stores entire parsed documents and notes in `localStorage`. This is not appropriate for long academic PDFs.

Implement a local-first persistence layer using **IndexedDB**, preferably with **Dexie**.

Use IndexedDB for:

- Documents
- Original file blob when practical
- Parsed pages
- Parsed text segments
- Notes
- AI discussions
- Translation records
- Export records

Keep `localStorage` only for small preferences such as:

- Selected theme
- Selected voice URI
- Playback speed
- Last active document ID
- Feature flags

Implement a one-time, non-destructive migration from the current keys:

- `sesli_makale_aktif`
- `sesli_makale_notlar`
- `sesli_makale_arsiv`

Migration requirements:

- Detect old data.
- Validate it.
- Import it into IndexedDB.
- Preserve notes and reading positions.
- Mark migration complete.
- Do not delete old localStorage data until migration succeeds.
- Provide a recovery/reset option in settings.

The MVP must continue to work in guest/local mode without requiring an account.

## 5.4 Optional cloud architecture

Supabase authentication and cloud synchronization are later-stage features, not blockers for the local MVP.

Design repositories/interfaces so a future cloud repository can be added without rewriting the UI.

If Supabase credentials exist, authentication may be implemented behind a feature flag. Do not make the core reader dependent on Supabase for the first working beta.

---

# 6. Correct Data Model

Replace the overly simple current `Article` and `Note` model with a clearer domain model. Preserve compatibility through migration adapters.

Suggested model:

```ts
export type DocumentFileType = 'pdf' | 'docx' | 'txt';

export interface AcademicDocument {
  id: string;
  title: string;
  authors?: string[];
  publicationYear?: number;
  doi?: string;
  fileName: string;
  fileType: DocumentFileType;
  fileSizeBytes: number;
  pageCount: number;
  language: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  lastReadAnchor?: ReadingAnchor;
  parseStatus: 'pending' | 'parsing' | 'ready' | 'failed';
  parseError?: string;
  originalFileBlobId?: string;
  source: 'upload' | 'sample';
}

export interface DocumentPage {
  id: string;
  documentId: string;
  pageNumber: number;
  rawText: string;
  normalizedText: string;
}

export interface TextSegment {
  id: string;
  documentId: string;
  pageNumber: number;
  blockIndex: number;
  globalIndex: number;
  text: string;
  segmentType: 'heading' | 'paragraph' | 'sentence' | 'figure-caption' | 'table-caption' | 'reference' | 'unknown';
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SourceAnchor {
  documentId: string;
  pageNumber: number;
  segmentId?: string;
  globalIndex?: number;
  selectedText: string;
  contextBefore?: string;
  contextAfter?: string;
  startOffset?: number;
  endOffset?: number;
}

export interface ReadingAnchor {
  documentId: string;
  pageNumber: number;
  segmentId?: string;
  globalIndex: number;
  characterOffset?: number;
}

export type NoteOrigin = 'voice' | 'typed' | 'discussion';

export interface ResearchNote {
  id: string;
  documentId: string;
  ordinal: number;
  sourceAnchor: SourceAnchor;
  origin: NoteOrigin;
  rawTranscript: string;
  cleanedAcademicNote?: string;
  finalNote: string;
  tags: string[];
  aiCleaningStatus: 'not-requested' | 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AcademicDiscussion {
  id: string;
  documentId: string;
  sourceAnchor: SourceAnchor;
  messages: DiscussionMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportRecord {
  id: string;
  documentId: string;
  format: 'markdown' | 'docx' | 'pdf' | 'txt';
  noteIds: string[];
  createdAt: string;
}
```

Use stable IDs. Prefer `crypto.randomUUID()` with a tested fallback.

Do not store only page/line numbers. Page/line numbers are useful metadata, but source anchoring must also preserve the selected text and surrounding context so notes remain understandable after reparsing.

---

# 7. Document Ingestion and Parsing

## 7.1 Supported file types

Mandatory:

- PDF
- DOCX
- TXT

Explicitly unsupported in MVP:

- Legacy binary `.doc`

When a user uploads `.doc`, show a clear Turkish message:

> “Eski Word (.doc) formatı desteklenmiyor. Lütfen dosyayı .docx veya .pdf olarak kaydedip tekrar yükleyin.”

Do not falsely claim `.doc` support.

## 7.2 Install parsing libraries locally

Do not rely on public CDN scripts for core parsing.

Prefer npm dependencies:

- `pdfjs-dist`
- `mammoth`

Configure the PDF.js worker correctly for Vite.

## 7.3 Parsing behavior

The parser must:

- Preserve page numbers.
- Extract readable text in correct reading order where possible.
- Reconstruct paragraphs from soft-wrapped PDF lines.
- Detect headings conservatively.
- Detect figure/table captions.
- Remove repeated headers and footers when confidence is high.
- Avoid removing legitimate academic content.
- Segment text into stable readable units.
- Track parse progress.
- Support cancellation.
- Handle corrupted/encrypted PDFs with friendly errors.
- Detect image-only/scanned PDFs with no useful text and show:
  - “Bu PDF taranmış görüntülerden oluşuyor olabilir. OCR henüz desteklenmiyor.”

Do not implement repeated expensive OCR calls in the first MVP.

## 7.4 Two-column papers

Academic PDFs frequently use two columns. Improve reading order carefully.

Requirements:

- Use PDF text item coordinates.
- Group items into lines using vertical tolerance.
- Detect likely column boundaries.
- Order left column before right column for each page when confidence is high.
- Fall back safely to standard ordering when confidence is low.
- Add unit tests with fixtures for single-column and two-column layouts.

## 7.5 Metadata

Attempt to infer:

- Title
- Author names
- DOI
- Publication year

Do not block upload if inference fails. Let the user edit metadata later.

---

# 8. Reader Workspace and UX

## 8.1 Product positioning in the interface

Remove generic “smart study companion” language.

Use wording such as:

- Aktif Okuma
- Araştırma Notları
- Kaynağa Bağlı Not
- Sesli Not
- Ham Döküm
- Düzenlenmiş Akademik Not
- Literatür Notları
- Okumaya Devam Et

Do not overuse “AI” in every label.

## 8.2 Desktop layout

Recommended workspace:

- Top app bar:
  - Product name
  - Current document title
  - Playback controls
  - Voice and speed settings
  - Privacy/status indicator
- Left sidebar:
  - Document pages or outline
  - Search within document
  - Translation/original toggle if available
- Center panel:
  - Readable document text
  - Active segment highlighting
  - Text selection support
- Right sidebar:
  - Source-linked research notes
  - Search/filter/tag controls
  - Export action

Avoid excessive full-width content. Use a comfortable academic reading width.

## 8.3 Mobile layout

On mobile:

- Use tabbed or bottom-sheet access for document, notes, and controls.
- Keep play/pause and “Not Al” actions reachable.
- Do not force three columns.
- Ensure microphone permission and recording states are obvious.
- Avoid tiny controls.

## 8.4 Text selection

Implement exact excerpt selection.

The user must be able to:

1. Select text in the document.
2. Click “Bu Metne Not Ekle.”
3. Record or type a note.
4. Save the selection as `SourceAnchor.selectedText`.
5. Preserve page, segment, offsets where available, and surrounding context.

If no text is selected, use the currently active spoken segment as the source anchor.

Show the linked source excerpt inside the note editor and note card.

Clicking a note’s source location must return the reader to the source and temporarily highlight it.

---

# 9. Text-to-Speech Engine

Use the Web Speech API for the local MVP, but describe it honestly.

## 9.1 Required behavior

- Load available voices reliably after `voiceschanged`.
- Normalize language tags such as `tr_TR`, `tr-TR`, and `tr`.
- Prefer voices matching the document language.
- Allow rate control from 0.75x to 2.0x.
- Allow pitch control only if useful; keep it in advanced settings if not central.
- Start from any segment.
- Highlight the active segment.
- Pause/resume reliably.
- Move to previous/next segment.
- Persist last reading position.
- When voice or speed changes during playback, restart from the current segment without jumping to the beginning.
- Cancel synthesis when document changes or modal recording begins.
- Handle mobile browser restrictions and user-gesture requirements.

## 9.2 Voice ranking

The existing voice ranking is rule-based, not AI.

Rename and document it as:

> Rule-based voice prioritization.

It may score voices using name, language, local/remote status, and known labels.

Important:

- Never invent “virtual premium voices” that do not exist on the user’s device.
- Do not label a voice “Google Cloud Wavenet” unless the application directly uses that API.
- Do not promise that Google Turkish or Siri voices are available.
- Clearly state that voice availability depends on browser and operating system.
- Remove duplicate speed options such as both `1` and `1.0`, or both `2` and `2.0`.

## 9.3 TTS text preparation

Keep useful pronunciation normalization, but test it.

Requirements:

- Turkish numbers and percentages should be read naturally.
- Do not corrupt DOI values, formulas, citations, abbreviations, or URLs.
- Provide a small test suite for normalization.

---

# 10. Speech Recognition and Hands-Free Notes

Use browser SpeechRecognition for the MVP when available.

## 10.1 Dictation workflow

When the user starts a voice note:

1. Pause TTS.
2. Preserve the active source anchor.
3. Request microphone permission if needed.
4. Show clear states:
   - Permission required
   - Listening
   - Silence detected
   - Processing
   - Stopped
   - Error
5. Display interim transcript.
6. Preserve the final raw transcript exactly.
7. Allow manual correction before save.
8. Never lose the transcript when the recognition session ends unexpectedly.

## 10.2 Browser limitations

Do not claim speech recognition is always local or offline.

Show a concise privacy explanation:

> “Ses tanıma davranışı tarayıcınıza ve cihazınıza bağlıdır; bazı tarayıcılar konuşmayı çevrim içi hizmetlerle işleyebilir.”

## 10.3 Long pauses

Browser recognition may stop after silence.

Implement controlled restart behavior with:

- Maximum retry count
- Debouncing
- Protection against duplicate transcripts
- Clear user control
- Handling for `no-speech`, `aborted`, permission denied, and network errors

Do not create infinite restart loops.

## 10.4 Hands-free commands

Preserve hands-free functionality as an optional feature.

Turkish primary commands may include:

- “Dur, not alalım”
- “Not al”
- “Okumayı durdur”

Requirements:

- Allow users to disable hands-free listening.
- Avoid microphone feedback from the TTS voice.
- Prefer pausing or ducking TTS before interpreting a command.
- Show a visible microphone-active indicator.
- Document battery/privacy implications.
- Keep multilingual command maps in a dedicated configuration file.

---

# 11. Source-Linked Research Note Workflow

This is the highest-priority feature.

## 11.1 Note editor

The note editor must contain:

- Source excerpt card
- Page number
- Optional section/heading
- Input mode indicator: voice or typed
- Raw transcript field
- “Akademik Olarak Düzenle” action
- Cleaned academic note field
- Final editable note field
- Tags
- Save/cancel

The user must always be able to save without AI cleaning.

## 11.2 AI note cleaning

Create a server endpoint such as:

- `POST /api/ai/clean-note`

Input:

```json
{
  "documentTitle": "...",
  "sourceExcerpt": "...",
  "rawTranscript": "...",
  "language": "tr",
  "instruction": "clarify without changing meaning"
}
```

Output must be validated structured JSON, for example:

```json
{
  "cleanedNote": "...",
  "suggestedTags": ["..."],
  "warnings": []
}
```

Prompt rules:

- Preserve the user’s meaning.
- Improve grammar and clarity.
- Do not invent evidence.
- Do not introduce citations that are not in the source.
- Do not turn uncertainty into certainty.
- Preserve first-person interpretation when relevant.
- If the transcript is unclear, return a warning rather than hallucinating.
- Keep the result concise and useful for later academic writing.

Store separately:

- Raw transcript
- AI-cleaned note
- User’s final edited note

Never overwrite the raw transcript.

## 11.3 Notes list

Each note card should show:

- Note number
- Page number
- Source excerpt
- Final note
- Tags
- Date/time
- Origin: voice/typed/discussion

Actions:

- Jump to source
- Edit
- Delete with confirmation
- Play note aloud
- Copy
- Include/exclude from export

Search and filtering:

- Search source and note text
- Filter by tag
- Sort by document order, creation time, or update time

Renumbering should not destroy stable IDs.

---

# 12. Export System

Professional export is mandatory.

Implement:

1. Markdown export
2. DOCX export
3. TXT export for backward compatibility
4. PDF export may be included after Markdown and DOCX are stable

Prefer the `docx` npm package for DOCX generation.

## 12.1 Export structure

The export should include:

- Product-neutral document title
- Paper metadata if known
- Export date
- Number of notes
- Notes ordered by page/source position by default

For every note:

- Note number
- Page number
- Source excerpt
- Raw transcript, optional through export settings
- Final academic note
- Tags
- Created date

Example Markdown:

```md
# Research Notes

## Paper
**Title:** Example Paper  
**Authors:** ...  
**DOI:** ...  

## Note 1 — Page 4

> Source excerpt: “...”

**Final note:**  
...

**Raw transcript:**  
...

**Tags:** methodology, hypothesis
```

## 12.2 Export options

Provide options for:

- Include raw transcripts
- Include source excerpts
- Include tags
- Order by source position or creation time
- Export selected notes only

Use sanitized filenames.

Record successful exports in `ExportRecord`.

---

# 13. Document Library

Create a proper library/dashboard.

Each document card should show:

- Title
- Authors if known
- File type
- File size
- Page count
- Language
- Number of notes
- Last opened time
- Reading progress
- Translation status if applicable

Actions:

- Continue reading
- Open notes
- Rename/edit metadata
- Export notes
- Delete document and associated data with confirmation

Support:

- Search
- Sort by recent/title/progress
- Filter by language or note status
- Empty state

Deleting a document must not accidentally delete another document’s notes.

---

# 14. Gemini and AI Architecture

## 14.1 Server-only secrets

The Gemini API key must remain server-side.

Environment variables:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
PORT=3000
AI_FEATURES_ENABLED=true
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

Do not hardcode the model in many files. Read it from configuration and provide a safe default.

Never commit real keys.

## 14.2 API reliability and security

Implement:

- Request validation, preferably with Zod
- Request-size limits
- Rate limiting
- Consistent error responses
- Timeouts
- Retry only for appropriate transient errors
- Abort support when the client cancels
- Basic structured logging without sensitive document text

Do not expose full documents in logs.

## 14.3 Feature boundaries

Separate AI services:

- Note cleaning
- Translation
- Contextual discussion
- Figure explanation

Do not put all prompts and endpoints in one huge `server.ts` file.

## 14.4 Contextual discussion

Preserve the current “Gemini discussion partner” as a secondary feature.

Rules:

- Scope the answer to the selected excerpt and supplied nearby context.
- Clearly distinguish source facts from interpretation.
- Do not claim the whole paper supports something when only one excerpt is provided.
- Store discussion separately from research notes.
- Allow the user to convert a discussion insight into a research note.

## 14.5 Translation

Preserve translation as an optional tool.

Requirements:

- Original/translated toggle
- Translate page range
- Progress indicator
- Cancellation
- Batch safely
- Preserve page alignment
- Mark translated text as AI-generated translation
- Inform the user that selected text is sent to Gemini
- Do not overwrite original content

## 14.6 Figure and graph explanation

The current implementation is unsafe if it generates trends from only a title.

Correct behavior:

- Do not fabricate graph values or trends.
- Use the caption and surrounding extracted text.
- If actual visual/data content is unavailable, say:
  - “Grafiğin görsel verilerine erişemediğim için yalnızca başlık ve çevresindeki metne dayanarak açıklama yapabilirim.”
- Label the result as an AI interpretation.
- Remove any fallback that automatically claims an upward trend, efficiency increase, or proven result without evidence.
- Keep this feature experimental behind a feature flag until it is trustworthy.

---

# 15. Landing Page and Product Presentation

Create a lightweight marketing landing page inside the same project, preferably at `/`, with the application at `/app` or `/library`.

Required sections:

1. Hero
   - Clear value proposition
   - Primary CTA: “Ücretsiz Beta’yı Dene”
   - Secondary CTA: “Nasıl Çalıştığını Gör”
2. Problem
   - Academic reading is passive and fragmented
3. Core workflow
   - Listen
   - Pause
   - Speak thought
   - Link to source
   - Export
4. Key features
5. Privacy/local-first explanation
6. Who it is for
7. Beta/waitlist form
8. FAQ

Do not include fake testimonials, fake user counts, fake university logos, or unsupported performance percentages.

Waitlist can initially save locally or use a clearly isolated server endpoint/database adapter. Do not block the core app on waitlist infrastructure.

---

# 16. Visual and Interaction Design

Design direction:

- Calm
- Academic
- Premium but not luxurious
- Modern
- Trustworthy
- High readability
- Minimal distraction

Recommended palette:

- Warm white/light gray background
- Deep navy for headings
- Muted indigo for primary actions
- Emerald for success states
- Amber for warnings
- Red only for destructive or recording states

Avoid:

- Excessive gradients
- Gaming aesthetics
- Cartoon visuals
- Overly dense dashboards
- Too much pure white without hierarchy
- Generic “AI sparkle” decoration everywhere

Typography:

- Modern sans-serif for interface
- Optional readable serif only inside document reading area
- Comfortable line height
- Maximum readable line width

Accessibility:

- Keyboard navigation
- Visible focus states
- Semantic buttons and labels
- ARIA for recording/playback states
- Sufficient color contrast
- Reduced-motion support
- Screen-reader-friendly progress and errors

---

# 17. Privacy and User Trust

Add an accessible privacy notice inside the app.

It must explain truthfully:

- Documents and notes are stored locally in the browser during the local-first MVP.
- Clearing browser data may delete local data unless exported/backed up.
- TTS voice availability depends on browser and OS.
- Speech recognition may use browser/vendor online services.
- Gemini features send only the required text/context to the configured AI service.
- Users can avoid AI features and still read and save notes locally.
- Users can delete their local data.

Add a “Verilerimi Sil” action with a strong confirmation step.

Do not say “100% offline” or “fully private” unless it is technically true for the selected feature.

---

# 18. Error Handling

Create consistent user-facing errors for:

- Unsupported file type
- Corrupted PDF
- Password-protected PDF
- Scanned/image-only PDF
- Document too large
- IndexedDB quota/storage failure
- Microphone denied
- Speech recognition unavailable
- No compatible TTS voice
- Gemini key missing
- Gemini rate limit
- Gemini timeout
- Translation partial failure
- Export failure

Errors must:

- Explain what happened
- Tell the user what they can do
- Avoid raw stack traces
- Preserve unsaved note text whenever possible

---

# 19. Testing Requirements

Add a real test setup.

Preferred tools:

- Vitest
- React Testing Library
- Playwright for critical end-to-end flows

## 19.1 Unit tests

Test at minimum:

- Language normalization
- Voice ranking
- TTS text normalization
- Paragraph reconstruction
- Sentence segmentation
- Header/footer filtering
- Graph-caption detection
- LocalStorage-to-IndexedDB migration
- Note ordering
- Source anchor serialization
- Markdown export
- DOCX export generation service
- AI response-schema validation

## 19.2 Component/integration tests

Test:

- Upload error states
- Note editor with selected excerpt
- Raw transcript preservation
- AI cleaning success/failure
- Note save/edit/delete
- Jump to source
- Export options
- Library delete confirmation

## 19.3 End-to-end smoke flows

At minimum:

1. Open app → upload TXT fixture → read → add typed note → export Markdown.
2. Open sample paper → select excerpt → create note → edit final note → jump back to source.
3. Reload browser → document, note, and reading position remain.
4. AI unavailable → local reading and note workflow still works.
5. Unsupported `.doc` upload → correct conversion message.

Mock Web Speech APIs in automated tests. Also provide a manual browser test checklist.

Browser testing priority:

- Chrome desktop
- Edge desktop
- Safari desktop where possible
- Chrome Android
- Safari iOS with documented limitations

Do not claim “zero bugs” merely because the build passes.

---

# 20. Performance Requirements

- Avoid loading the entire large document into every React render.
- Memoize derived segments and note filters.
- Consider virtualizing very long reader content.
- Parse large PDFs without freezing the interface where practical.
- Avoid storing duplicate translated/original structures unnecessarily.
- Lazy-load secondary features.
- Abort old translation/AI requests when a new request starts.
- Keep production bundle reasonable and report major bundle contributors.

---

# 21. Security Requirements

- API keys only on server.
- Validate all API requests.
- Sanitize generated filenames.
- Do not render AI or document content through unsafe HTML.
- Add sensible Express security middleware.
- Add rate limits to AI endpoints.
- Limit body size.
- Do not log raw microphone audio or whole documents.
- Do not upload documents to the server unless a feature explicitly requires it and the user is informed.
- Avoid using `dangerouslySetInnerHTML` unless sanitized and essential.

---

# 22. Implementation Phases

Work in the following order. Update `CHANGELOG.md` and `docs/IMPLEMENTATION_PLAN.md` after every phase.

## Phase 0 — Audit and baseline

- Inspect repository
- Run build/lint
- Document current behavior and problems
- Create baseline commit

## Phase 1 — Architecture and persistence

- Split large files incrementally
- Introduce feature modules
- Add IndexedDB/Dexie
- Migrate localStorage data
- Add repository abstraction
- Preserve current behavior

## Phase 2 — Core academic note workflow

- Exact text selection
- SourceAnchor
- New ResearchNote model
- Raw transcript
- Final note editing
- Jump to source
- Notes search/tags

## Phase 3 — AI note cleaning

- Server route
- Validated structured response
- Cleaned note UI
- Preserve raw transcript
- Graceful fallback

## Phase 4 — Export

- Markdown
- DOCX
- Improved TXT
- Export settings
- Export tests

## Phase 5 — Reader and library polish

- Reader layout
- Responsive UI
- Search and progress
- Library filters/sorting
- Reliable TTS and dictation states

## Phase 6 — Secondary features cleanup

- Translation modularization
- Discussion modularization
- Safe figure explanation
- Feature flags
- Remove misleading AI/voice claims

## Phase 7 — Landing, privacy, and beta readiness

- Landing page
- Waitlist
- Privacy notice
- Data reset/export
- Error states
- Browser testing
- Demo-ready sample workflow

## Phase 8 — Optional authentication/cloud foundation

Only after the local MVP is stable:

- Supabase auth behind feature flag
- Cloud repository interface
- Do not force cloud sync into the MVP

---

# 23. MVP Scope and Non-Goals

The first real beta must include:

- PDF/DOCX/TXT upload
- Reliable document parsing
- TTS reading
- Current segment highlighting
- Text selection or current-segment source anchor
- Typed note
- Voice note when supported
- Raw transcript
- AI-cleaned note as optional
- Final editable note
- Local library
- Reading-position persistence
- Markdown export
- DOCX export
- Privacy notice
- Responsive interface
- Landing page or clear beta entry page

Do not delay the MVP for:

- Native Android/iOS apps
- Stripe or payment system
- Pomodoro
- Calendar
- Flashcards
- Social features
- Team collaboration
- Full citation manager
- Full Zotero integration
- OCR
- Real-time collaboration
- Complex analytics

Create clean extension points, but do not implement these before the core flow is complete.

---

# 24. Definition of Done

The MVP/Beta is complete only when all of these are true:

1. A user can upload a PDF, DOCX, or TXT file.
2. The document is parsed with page-aware readable segments.
3. The user can listen from any segment.
4. The active segment is visibly highlighted.
5. The user can select an exact excerpt or use the active segment.
6. The user can type or dictate a note.
7. The raw transcript is preserved.
8. The user can optionally request an AI-cleaned note.
9. The user can edit and save the final note.
10. The note contains source excerpt, page, stable anchor, and timestamps.
11. Clicking the source returns to the correct place.
12. Documents and notes survive reload using IndexedDB.
13. Existing localStorage users are migrated safely.
14. The user can export structured notes to Markdown and DOCX.
15. The app still works for local reading and notes when Gemini is unavailable.
16. The privacy notice accurately explains storage, STT, and AI processing.
17. The project passes TypeScript checks, production build, and tests.
18. A manual browser test checklist is completed and documented.
19. No API key appears in the client bundle or repository.
20. No UI copy falsely claims unsupported `.doc`, fully offline STT, guaranteed premium voices, or evidence-free graph analysis.

---

# 25. Required Documentation and Deliverables

At completion, provide:

- Working source code
- Updated `README.md`
- `.env.example`
- `docs/CURRENT_STATE_AUDIT.md`
- `docs/ARCHITECTURE.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/DATA_MODEL.md`
- `docs/PRIVACY_AND_DATA_FLOW.md`
- `docs/MANUAL_TEST_CHECKLIST.md`
- `docs/KNOWN_LIMITATIONS.md`
- `CHANGELOG.md`
- Test suite
- Sample fixture documents that are legally safe to include
- Clear local setup instructions
- Clear production build instructions

README must include:

```bash
npm install
cp .env.example .env.local
npm run dev
npm run lint
npm run test
npm run build
npm run start
```

Adjust commands to match the final scripts.

---

# 26. Coding Rules

- Use strict TypeScript.
- Avoid `any`; isolate unavoidable browser API typings.
- Keep components focused.
- Keep domain logic outside JSX.
- Do not duplicate voice-ranking logic in multiple files.
- Do not duplicate language maps in multiple files.
- Centralize API calls.
- Use schema validation for external responses.
- Use descriptive names.
- Add comments for non-obvious parsing/speech behavior, not for trivial code.
- Keep all user-facing Turkish text professional and grammatically correct.
- Preserve user data during refactors.
- Avoid speculative “smart” behavior that can damage academic trust.
- Prefer an honest limitation message over fabricated output.

---

# 27. Specific Existing Problems to Audit and Correct

Verify and fix these known concerns:

1. Very large monolithic files such as `App.tsx`, `useSpeechEngine.ts`, `documentParser.ts`, `ReaderPanel.tsx`, and `SpeechRecordingModal.tsx`.
2. `localStorage` storing large document structures.
3. Duplicate voice-ranking code in Navbar and the speech hook.
4. Duplicate speed options.
5. Fake or misleading virtual/premium voice names.
6. Claims that Web Speech recognition is always local/offline.
7. `.doc` being included in types while parser rejects it.
8. Unsafe graph fallback text that invents upward trends or proven improvements.
9. API endpoints without authentication, validation, rate limiting, or usage control.
10. Hardcoded AI model names.
11. AI Studio placeholder README and branding.
12. CDN dependency for core parsers.
13. No professional Markdown/DOCX export.
14. Notes connected only to current line rather than exact selected text.
15. Only one `noteText` field instead of raw/cleaned/final note states.
16. No real local database or data migration.
17. Potential TTS/STT conflicts and microphone feedback.
18. No formal test suite.
19. Overconfident copy such as “zero error,” “perfect,” “AI voice ranking,” or guaranteed browser voices.
20. Figure explanations based on insufficient evidence.

---

# 28. How You Should Work and Report Progress

For each implementation phase:

1. State the phase goal briefly.
2. List files being changed.
3. Implement the smallest coherent vertical slice.
4. Run type checking, tests, and build.
5. Fix failures before moving on.
6. Update documentation and changelog.
7. Create a Git commit with a clear message when practical.
8. Summarize:
   - What changed
   - What remains
   - Known risks
   - Exact commands run

Do not claim success without running the relevant commands.

If a browser-specific speech feature cannot be automatically verified, mark it for manual testing instead of pretending it passed.

---

# 29. Start Now

Begin by performing the repository audit and baseline checks.

Then create the implementation documents and start Phase 1.

Do not start with cosmetic redesign alone. Preserve the working prototype, stabilize architecture and data, then complete the exact source-linked note and export workflow.

The final product must be a trustworthy academic active-reading assistant whose strongest experience is:

> I listen to a paper, stop at an important passage, speak my own thought, preserve the raw idea, turn it into a clean research note, and export it with the exact source context.
