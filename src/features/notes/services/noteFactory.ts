import type { ResearchNote, SourceAnchor, NoteOrigin } from '../../../types/domain';
import { newId } from '../../../lib/ids';

export interface NewNoteInput {
  documentId: string;
  ordinal: number;
  sourceAnchor: SourceAnchor;
  origin: NoteOrigin;
  /** The user's words, exactly as dictated/typed. Never overwritten later. */
  rawTranscript: string;
  /** The user's final, edited note. Defaults to the raw transcript when omitted. */
  finalNote?: string;
  tags?: string[];
  /** Injectable timestamp for deterministic tests. */
  now?: string;
}

/** Create a `ResearchNote` from a captured transcript and its source anchor. */
export function createResearchNote(input: NewNoteInput): ResearchNote {
  const now = input.now ?? new Date().toISOString();
  const raw = input.rawTranscript.trim();
  const final = (input.finalNote ?? input.rawTranscript).trim();
  return {
    id: newId(),
    documentId: input.documentId,
    ordinal: input.ordinal,
    sourceAnchor: input.sourceAnchor,
    origin: input.origin,
    rawTranscript: raw,
    cleanedAcademicNote: undefined,
    finalNote: final,
    tags: normalizeTags(input.tags ?? []),
    aiCleaningStatus: 'not-requested',
    createdAt: now,
    updatedAt: now,
  };
}

/** Trim, de-duplicate, and drop empty tags while preserving order. */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

/** Parse a comma-separated tag input string into a normalized tag list. */
export function parseTagInput(value: string): string[] {
  return normalizeTags(value.split(','));
}
