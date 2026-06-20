# DATA MODEL — EidosUs

## Target domain model

The MVP replaces the flat `Article` / `Note` prototype model with a source-aware domain model. The canonical TypeScript definitions live in code (`src/features/*/types` once migrated, mirrored from CLAUDE.md §6). Summary:

- **AcademicDocument** — title, optional authors/year/doi, fileName, fileType (`pdf|docx|txt`), size, pageCount, language, timestamps, `lastReadAnchor`, `parseStatus`, optional `originalFileBlobId`, `source` (`upload|sample`).
- **DocumentPage** — `{id, documentId, pageNumber, rawText, normalizedText}`.
- **TextSegment** — stable readable unit: `{id, documentId, pageNumber, blockIndex, globalIndex, text, segmentType, boundingBox?}` where `segmentType ∈ heading|paragraph|sentence|figure-caption|table-caption|reference|unknown`.
- **SourceAnchor** — the heart of the product: `{documentId, pageNumber, segmentId?, globalIndex?, selectedText, contextBefore?, contextAfter?, startOffset?, endOffset?}`. Stores the **actual text**, not just page/line, so notes survive reparsing.
- **ReadingAnchor** — last reading position: `{documentId, pageNumber, segmentId?, globalIndex, characterOffset?}`.
- **ResearchNote** — `{id, documentId, ordinal, sourceAnchor, origin (voice|typed|discussion), rawTranscript, cleanedAcademicNote?, finalNote, tags[], aiCleaningStatus, createdAt, updatedAt}`. **Three distinct text fields**; `rawTranscript` is never overwritten.
- **AcademicDiscussion / DiscussionMessage** — Gemini debate sessions, stored separately from notes; convertible into a `ResearchNote`.
- **ExportRecord** — `{id, documentId, format, noteIds[], createdAt}`.

IDs: `crypto.randomUUID()` with a tested fallback (`lib/ids.ts`).

## Legacy model (prototype, to be migrated via adapters)

From `src/types.ts`:

- **Article** — `{id, serialNumber?, title, fileName, fileSize, fileType: 'pdf'|'docx'|'doc'|'txt', text, pages: ParsedPage[], lines: ParsedLine[], language?, original* copies, lastReadIndex?}`.
- **ParsedLine** — `{text, pageNumber, lineNumber, globalIndex, isHeading?, isGraph?, graphSummary?}`.
- **ParsedPage** — `{pageNumber, text, lines: string[]}`.
- **Note** — `{id, number, timestamp, pageNumber, lineNumber, contextText, noteText, createdAt, articleId, articleTitle}`.

## Migration mapping (legacy → target)

| Legacy | Target |
|---|---|
| `Article.id` | `AcademicDocument.id` |
| `Article.title` | `AcademicDocument.title` |
| `Article.fileType 'doc'` | dropped — `.doc` unsupported; mapped to `txt` only if already parsed text exists |
| `Article.pages[]` | `DocumentPage[]` (`rawText`/`normalizedText` from `page.text`) |
| `Article.lines[]` | `TextSegment[]` (`globalIndex`, `pageNumber`, `segmentType` from `isHeading`/`isGraph`) |
| `Article.lastReadIndex` | `AcademicDocument.lastReadAnchor` (`globalIndex`) |
| `Note.contextText` | `ResearchNote.sourceAnchor.selectedText` |
| `Note.pageNumber/lineNumber` | `sourceAnchor.pageNumber` / resolved `segmentId`+`globalIndex` |
| `Note.noteText` | `ResearchNote.rawTranscript` **and** `finalNote` (cleaned = undefined; origin inferred `typed`) |
| `Note.number` | `ResearchNote.ordinal` |
| `Note.timestamp/createdAt` | `createdAt` / `updatedAt` |

The migration is non-destructive: legacy localStorage keys are read, validated, written to IndexedDB, and only flagged complete on success; original keys are left intact for recovery.
