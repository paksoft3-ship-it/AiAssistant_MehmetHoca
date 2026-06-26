import type { ResearchProject } from '../../types/domain';
import { getDb } from '../database';
import { newId } from '../../lib/ids';

/** Repository for research projects (Beta spec §23). */
export const projectRepository = {
  async create(input: { name: string; description?: string; color?: string; now?: string }): Promise<ResearchProject> {
    const now = input.now ?? new Date().toISOString();
    const project: ResearchProject = {
      id: newId(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      color: input.color,
      createdAt: now,
      updatedAt: now,
    };
    await getDb().projects.put(project);
    return project;
  },

  async list(): Promise<ResearchProject[]> {
    const all = await getDb().projects.toArray();
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async update(id: string, patch: Partial<Pick<ResearchProject, 'name' | 'description' | 'color'>>): Promise<void> {
    await getDb().projects.update(id, { ...patch, updatedAt: new Date().toISOString() });
  },

  async remove(id: string): Promise<void> {
    // Detach documents from the project, then delete it (documents are kept).
    const db = getDb();
    const docs = await db.documents.where('projectId').equals(id).toArray();
    await Promise.all(docs.map((d) => db.documents.update(d.id, { projectId: undefined })));
    await db.projects.delete(id);
  },

  /** Assign (or clear with null) a document's project. */
  async assignDocument(documentId: string, projectId: string | null): Promise<void> {
    await getDb().documents.update(documentId, { projectId: projectId ?? undefined });
  },
};
