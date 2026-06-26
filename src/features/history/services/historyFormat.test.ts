import { describe, it, expect } from 'vitest';
import { describeEvent } from './historyFormat';
import type { HistoryEvent } from '../../../types/domain';

function ev(p: Partial<HistoryEvent> & { type: HistoryEvent['type'] }): HistoryEvent {
  return { id: '1', createdAt: '2026-06-26T10:00:00.000Z', ...p };
}

describe('describeEvent', () => {
  it('maps known types to icon + label', () => {
    expect(describeEvent(ev({ type: 'note_created' })).label).toBe('Not eklendi');
    expect(describeEvent(ev({ type: 'url_imported' })).icon).toBe('link');
  });

  it('extracts a detail from metadata (title/name/format)', () => {
    expect(describeEvent(ev({ type: 'document_opened', metadata: { title: 'Makale' } })).detail).toBe('Makale');
    expect(describeEvent(ev({ type: 'export_created', metadata: { format: 'xlsx' } })).detail).toBe('xlsx');
    expect(describeEvent(ev({ type: 'project_created', metadata: { name: 'Tez' } })).detail).toBe('Tez');
  });

  it('has no detail when metadata is absent', () => {
    expect(describeEvent(ev({ type: 'document_opened' })).detail).toBeUndefined();
  });
});
