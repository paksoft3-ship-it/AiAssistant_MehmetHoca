import { useCallback, useEffect, useState } from 'react';
import type { Article } from '../../../types';
import { documentService, type LibraryEntry } from '../services/documentService';

export interface UseLibrary {
  entries: LibraryEntry[];
  loading: boolean;
  reload: () => Promise<void>;
  saveArticle: (article: Article, source?: 'upload' | 'sample') => Promise<void>;
  openArticle: (documentId: string) => Promise<Article | null>;
  removeDocument: (documentId: string) => Promise<void>;
}

/** React binding over the document library (IndexedDB-backed). */
export function useLibrary(): UseLibrary {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await documentService.listLibrary());
    } catch (err) {
      console.error('[EidosUs] Failed to load library:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveArticle = useCallback(
    async (article: Article, source: 'upload' | 'sample' = 'upload') => {
      await documentService.saveArticle(article, source);
      await reload();
    },
    [reload],
  );

  const openArticle = useCallback(async (documentId: string) => {
    return documentService.openArticle(documentId);
  }, []);

  const removeDocument = useCallback(
    async (documentId: string) => {
      await documentService.remove(documentId);
      await reload();
    },
    [reload],
  );

  return { entries, loading, reload, saveArticle, openArticle, removeDocument };
}
