import { useCallback, useEffect, useState } from 'react';
import type { ResearchProject } from '../../../types/domain';
import { projectRepository, historyRepository } from '../../../db/repositories';

export interface UseProjects {
  projects: ResearchProject[];
  reload: () => Promise<void>;
  createProject: (name: string) => Promise<ResearchProject | null>;
  removeProject: (id: string) => Promise<void>;
  assignDocument: (documentId: string, projectId: string | null) => Promise<void>;
}

/** Loads and mutates research projects (Beta spec §23). Projects are optional. */
export function useProjects(): UseProjects {
  const [projects, setProjects] = useState<ResearchProject[]>([]);

  const reload = useCallback(async () => {
    setProjects(await projectRepository.list());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createProject = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const project = await projectRepository.create({ name: trimmed });
      void historyRepository.add({ type: 'project_created', projectId: project.id, metadata: { name: project.name } });
      await reload();
      return project;
    },
    [reload],
  );

  const removeProject = useCallback(
    async (id: string) => {
      await projectRepository.remove(id);
      await reload();
    },
    [reload],
  );

  const assignDocument = useCallback(async (documentId: string, projectId: string | null) => {
    await projectRepository.assignDocument(documentId, projectId);
  }, []);

  return { projects, reload, createProject, removeProject, assignDocument };
}
