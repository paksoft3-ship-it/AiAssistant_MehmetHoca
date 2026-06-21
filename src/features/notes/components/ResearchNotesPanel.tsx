import { useMemo, useState } from 'react';
import type { ResearchNote, SourceAnchor } from '../../../types/domain';
import { Icon } from '../../../components/ui/Icon';
import { searchNotes, sortNotes, filterByTag, collectTags, type NoteSortKey } from '../services/noteQueries';
import { parseTagInput } from '../services/noteFactory';

export interface ResearchNotesPanelProps {
  notes: ResearchNote[];
  documentTitle: string;
  onJumpToSource: (anchor: SourceAnchor) => void;
  onUpdateNote: (id: string, patch: { finalNote?: string; tags?: string[] }) => void;
  onDeleteNote: (id: string) => void;
  onPlayNote: (note: ResearchNote) => void;
  onExport?: () => void;
}

const ORIGIN_META: Record<ResearchNote['origin'], { label: string; icon: string }> = {
  voice: { label: 'Sesli', icon: 'mic' },
  typed: { label: 'Yazılı', icon: 'keyboard' },
  discussion: { label: 'Tartışma', icon: 'forum' },
};

export default function ResearchNotesPanel({
  notes,
  onJumpToSource,
  onUpdateNote,
  onDeleteNote,
  onPlayNote,
  onExport,
}: ResearchNotesPanelProps) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<NoteSortKey>('source');
  const [activeTag, setActiveTag] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFinal, setEditFinal] = useState('');
  const [editTags, setEditTags] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const allTags = useMemo(() => collectTags(notes), [notes]);
  const visible = useMemo(() => {
    let list = filterByTag(notes, activeTag);
    list = searchNotes(list, query);
    return sortNotes(list, sortKey);
  }, [notes, activeTag, query, sortKey]);

  const startEdit = (note: ResearchNote) => {
    setEditingId(note.id);
    setEditFinal(note.finalNote);
    setEditTags(note.tags.join(', '));
  };
  const saveEdit = (id: string) => {
    onUpdateNote(id, { finalNote: editFinal.trim(), tags: parseTagInput(editTags) });
    setEditingId(null);
  };

  return (
    <div className="flex h-full flex-col bg-canvas">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-2">
          <h3 className="font-h2-section-title text-h2-section-title text-on-surface dark:text-white">Araştırma Notları</h3>
          <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-mono text-label-mono text-text">{notes.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text-muted transition-colors hover:bg-surface-muted" title="Sırala">
            <Icon name="sort" className="text-[20px]" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as NoteSortKey)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Sırala"
            >
              <option value="source">Kaynak sırası</option>
              <option value="created">Eklenme</option>
              <option value="updated">Güncelleme</option>
            </select>
          </label>
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-muted"
            >
              <Icon name="ios_share" className="text-[18px]" />
              Dışa Aktar
            </button>
          )}
        </div>
      </div>

      {/* Search + tag filters */}
      {notes.length > 0 && (
        <div className="shrink-0 space-y-3 border-b border-border bg-surface/50 p-4">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Notlarda ara..."
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 font-body-ui text-body-ui transition-colors focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
          {allTags.length > 0 && (
            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTag('')}
                className={`shrink-0 rounded-full px-3 py-1 font-small text-small transition-colors ${
                  activeTag === '' ? 'border border-primary/20 bg-primary-soft font-medium text-primary' : 'border border-border bg-surface text-text-muted hover:bg-surface-muted'
                }`}
              >
                Tümü
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                  className={`shrink-0 rounded-full px-3 py-1 font-small text-small transition-colors ${
                    activeTag === tag ? 'border border-primary/20 bg-primary-soft font-medium text-primary' : 'border border-border bg-surface text-text-muted hover:bg-surface-muted'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes list */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {visible.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface text-text-muted">
              <Icon name="edit_note" className="text-[32px]" />
            </div>
            <h4 className="mt-4 font-h3-card-title text-h3-card-title text-on-surface dark:text-white">
              {notes.length === 0 ? 'Henüz Not Yok' : 'Eşleşen not bulunamadı'}
            </h4>
            <p className="mt-1.5 max-w-[260px] font-small text-small leading-relaxed text-text-muted">
              Okurken bir pasaj seçin ya da dinlerken durup{' '}
              <span className="font-medium text-danger">Dur, Not Alalım!</span> ile fikrinizi kaydedin.
            </p>
          </div>
        ) : (
          visible.map((note) => {
            const origin = ORIGIN_META[note.origin];
            const isEditing = editingId === note.id;
            const isAi = note.aiCleaningStatus === 'completed';
            return (
              <div
                key={note.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/30 dark:bg-slate-900"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                {/* Meta row */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-surface-muted px-1.5 py-0.5 font-label-mono text-label-mono text-text-muted dark:bg-slate-800">#{note.ordinal}</span>
                    <button
                      onClick={() => onJumpToSource(note.sourceAnchor)}
                      className="flex items-center gap-0.5 font-small text-small text-primary hover:underline"
                    >
                      Sayfa {note.sourceAnchor.pageNumber}
                      <Icon name="arrow_outward" className="text-[14px]" />
                    </button>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    <span className="flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 font-label-mono text-label-mono text-text-muted dark:bg-slate-800">
                      <Icon name={origin.icon} className="text-[12px]" /> {origin.label}
                    </span>
                    {isAi && (
                      <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 font-label-mono text-label-mono text-primary">
                        <Icon name="auto_fix_high" className="text-[12px]" /> Düzenlendi
                      </span>
                    )}
                  </div>
                </div>

                {/* Source excerpt */}
                {note.sourceAnchor.selectedText && (
                  <div className="mb-3 border-l-2 border-border pl-3">
                    <p className="line-clamp-2 font-body-reading text-small italic text-text-muted">
                      &ldquo;{note.sourceAnchor.selectedText}&rdquo;
                    </p>
                  </div>
                )}

                {/* Note body or editor */}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editFinal}
                      onChange={(e) => setEditFinal(e.target.value)}
                      className="min-h-[64px] w-full rounded-lg border border-border p-2 font-body-ui text-body-ui focus:ring-1 focus:ring-primary dark:bg-slate-950 dark:text-white"
                    />
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Etiketler (virgülle)"
                      className="w-full rounded-lg border border-border px-2 py-1.5 font-small text-small focus:ring-1 focus:ring-primary dark:bg-slate-950 dark:text-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => saveEdit(note.id)} className="rounded-lg bg-primary px-3 py-1 font-small text-small font-medium text-on-primary hover:bg-primary-hover">Kaydet</button>
                      <button onClick={() => setEditingId(null)} className="rounded-lg px-3 py-1 font-small text-small text-text-muted hover:bg-surface-muted">İptal</button>
                    </div>
                  </div>
                ) : (
                  <p className="mb-4 font-body-ui text-body-ui text-on-surface dark:text-slate-200">{note.finalNote}</p>
                )}

                {/* Footer: tags + actions */}
                {!isEditing && (
                  <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {note.tags.map((t) => (
                        <span key={t} className="font-small text-small text-text-muted">#{t}</span>
                      ))}
                    </div>
                    {confirmId === note.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-small text-small text-danger">Silinsin mi?</span>
                        <button onClick={() => { onDeleteNote(note.id); setConfirmId(null); }} className="rounded-md bg-danger px-2 py-1 font-label-mono text-label-mono text-on-error">Evet</button>
                        <button onClick={() => setConfirmId(null)} className="rounded-md px-2 py-1 font-label-mono text-label-mono text-text-muted hover:bg-surface-muted">Vazgeç</button>
                      </div>
                    ) : (
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => onPlayNote(note)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-primary" title="Dinle">
                          <Icon name="volume_up" className="text-[18px]" />
                        </button>
                        <button onClick={() => startEdit(note)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted" title="Düzenle">
                          <Icon name="edit" className="text-[18px]" />
                        </button>
                        <button onClick={() => setConfirmId(note.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger-soft hover:text-danger" title="Sil">
                          <Icon name="delete" className="text-[18px]" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
