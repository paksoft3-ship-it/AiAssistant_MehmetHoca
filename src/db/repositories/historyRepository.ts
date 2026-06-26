import type { HistoryEvent } from '../../types/domain';
import { getDb } from '../database';
import { newId } from '../../lib/ids';

/** Repository for the activity-history timeline (Beta spec §22). */
export const historyRepository = {
  /** Record an event. Best-effort: callers should not block on it. */
  async add(event: Omit<HistoryEvent, 'id' | 'createdAt'> & { createdAt?: string }): Promise<void> {
    const record: HistoryEvent = {
      id: newId(),
      createdAt: event.createdAt ?? new Date().toISOString(),
      type: event.type,
      documentId: event.documentId,
      projectId: event.projectId,
      noteId: event.noteId,
      metadata: event.metadata,
    };
    await getDb().history.put(record);
  },

  /** Most-recent-first timeline. */
  async list(): Promise<HistoryEvent[]> {
    const all = await getDb().history.toArray();
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async clear(): Promise<void> {
    await getDb().history.clear();
  },
};
