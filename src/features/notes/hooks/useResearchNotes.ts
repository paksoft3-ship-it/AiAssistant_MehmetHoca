import { useCallback, useEffect, useState } from 'react';
import type { ResearchNote, SourceAnchor, NoteOrigin } from '../../../types/domain';
import { noteRepository } from '../../../db/repositories';
import { createResearchNote } from '../services/noteFactory';

export interface AddNoteInput {
  sourceAnchor: SourceAnchor;
  origin: NoteOrigin;
  rawTranscript: string;
  finalNote?: string;
  cleanedAcademicNote?: string;
  tags?: string[];
}

export interface UseResearchNotes {
  notes: ResearchNote[];
  loading: boolean;
  reload: () => Promise<void>;
  addNote: (input: AddNoteInput) => Promise<ResearchNote | null>;
  updateNote: (
    id: string,
    patch: Partial<Pick<ResearchNote, 'finalNote' | 'tags' | 'cleanedAcademicNote' | 'aiCleaningStatus'>>,
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

/**
 * Loads and mutates the research notes for one document, backed by IndexedDB.
 * Returns an empty list (not an error) when there is no active document.
 */
export function useResearchNotes(documentId: string | null | undefined): UseResearchNotes {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!documentId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    try {
      setNotes(await noteRepository.listByDocument(documentId));
    } catch (err) {
      console.error('[EidosUs] Failed to load notes:', err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addNote = useCallback(
    async (input: AddNoteInput): Promise<ResearchNote | null> => {
      if (!documentId) return null;
      const ordinal = await noteRepository.nextOrdinal(documentId);
      const note = createResearchNote({
        documentId,
        ordinal,
        sourceAnchor: input.sourceAnchor,
        origin: input.origin,
        rawTranscript: input.rawTranscript,
        finalNote: input.finalNote,
        cleanedAcademicNote: input.cleanedAcademicNote,
        tags: input.tags,
      });
      await noteRepository.create(note);
      await reload();
      return note;
    },
    [documentId, reload],
  );

  const updateNote = useCallback<UseResearchNotes['updateNote']>(
    async (id, patch) => {
      await noteRepository.update(id, patch);
      await reload();
    },
    [reload],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await noteRepository.remove(id);
      await reload();
    },
    [reload],
  );

  return { notes, loading, reload, addNote, updateNote, deleteNote };
}
