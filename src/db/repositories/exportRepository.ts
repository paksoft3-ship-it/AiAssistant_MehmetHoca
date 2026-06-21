import type { ExportRecord } from '../../types/domain';
import { getDb } from '../database';

/** Repository for export history records. */
export const exportRepository = {
  async create(record: ExportRecord): Promise<void> {
    await getDb().exports.put(record);
  },

  async listByDocument(documentId: string): Promise<ExportRecord[]> {
    const records = await getDb().exports.where('documentId').equals(documentId).toArray();
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
