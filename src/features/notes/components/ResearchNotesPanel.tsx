import { useMemo, useState } from 'react';
import {
  Search, Edit2, Trash2, Check, X, Volume2, ArrowUpRight, Tag, Mic, Keyboard, MessageSquare,
} from 'lucide-react';
import type { ResearchNote, SourceAnchor } from '../../../types/domain';
import { searchNotes, sortNotes, filterByTag, collectTags, type NoteSortKey } from '../services/noteQueries';
import { parseTagInput } from '../services/noteFactory';

export interface ResearchNotesPanelProps {
  notes: ResearchNote[];
  documentTitle: string;
  onJumpToSource: (anchor: SourceAnchor) => void;
  onUpdateNote: (id: string, patch: { finalNote?: string; tags?: string[] }) => void;
  onDeleteNote: (id: string) => void;
  onPlayNote: (note: ResearchNote) => void;
}

const ORIGIN_META: Record<ResearchNote['origin'], { label: string; icon: typeof Mic }> = {
  voice: { label: 'Sesli', icon: Mic },
  typed: { label: 'Yazılı', icon: Keyboard },
  discussion: { label: 'Tartışma', icon: MessageSquare },
};

export default function ResearchNotesPanel({
  notes,
  documentTitle,
  onJumpToSource,
  onUpdateNote,
  onDeleteNote,
  onPlayNote,
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
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 font-sans text-base font-bold text-slate-900 dark:text-white">
            Araştırma Notları
            <span className="flex h-5 items-center justify-center rounded-full bg-indigo-50 px-2 text-2xs font-extrabold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              {notes.length}
            </span>
          </h3>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as NoteSortKey)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            title="Sıralama"
          >
            <option value="source">Kaynak sırası</option>
            <option value="created">Eklenme</option>
            <option value="updated">Güncelleme</option>
          </select>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-400">{documentTitle}</p>

        {notes.length > 0 && (
          <>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Notlarda, pasajda ve etiketlerde ara..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/30 py-2 pl-9 pr-4 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            {allTags.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setActiveTag('')}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                    activeTag === ''
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  Tümü
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                      activeTag === tag
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/50 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-800/40">
              <Mic className="h-6 w-6" />
            </div>
            <h4 className="mt-4 text-xs font-bold text-slate-700 dark:text-slate-200">
              {notes.length === 0 ? 'Henüz Not Yok' : 'Eşleşen not bulunamadı'}
            </h4>
            <p className="mt-1 max-w-xs text-2xs leading-relaxed text-slate-400">
              Okurken bir pasaj seçin ya da dinlerken durup{' '}
              <strong className="text-red-500">Dur, Not Alalım!</strong> ile fikrinizi kaydedin.
            </p>
          </div>
        ) : (
          visible.map((note) => {
            const Origin = ORIGIN_META[note.origin];
            const isEditing = editingId === note.id;
            return (
              <div
                key={note.id}
                className="group rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-3xs transition hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-mono font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      #{note.ordinal}
                    </span>
                    <button
                      onClick={() => onJumpToSource(note.sourceAnchor)}
                      className="inline-flex items-center gap-0.5 rounded bg-indigo-50/70 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-700 transition hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:text-indigo-400"
                      title="Makaledeki kaynağa dön"
                    >
                      <span>Sayfa {note.sourceAnchor.pageNumber}</span>
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    </button>
                    <span className="inline-flex items-center gap-0.5 rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:bg-slate-800/60">
                      <Origin.icon className="h-2.5 w-2.5" />
                      {Origin.label}
                    </span>
                  </div>
                </div>

                {/* Source excerpt */}
                <div className="mt-2 line-clamp-2 border-l border-slate-200 pl-2 text-2xs italic text-slate-400 dark:border-slate-700">
                  &ldquo;{note.sourceAnchor.selectedText}&rdquo;
                </div>

                {/* Final note (or editor) */}
                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={editFinal}
                      onChange={(e) => setEditFinal(e.target.value)}
                      className="min-h-[60px] w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Etiketler (virgülle)"
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-700 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => saveEdit(note.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300"
                      >
                        <Check className="h-3 w-3" /> Kaydet
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <X className="h-3 w-3" /> İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 break-words text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                    {note.finalNote}
                  </p>
                )}

                {/* Tags */}
                {!isEditing && note.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      >
                        <Tag className="h-2 w-2" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {!isEditing && (
                  <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-slate-100/60 pt-2.5 dark:border-slate-800">
                    {confirmId === note.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-red-600">Silinsin mi?</span>
                        <button
                          onClick={() => {
                            onDeleteNote(note.id);
                            setConfirmId(null);
                          }}
                          className="rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-700"
                        >
                          Evet, Sil
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="rounded-md px-2 py-1 text-[10px] font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Vazgeç
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onPlayNote(note)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="Notu sesli dinle"
                        >
                          <Volume2 className="h-3 w-3" /> Dinle
                        </button>
                        <button
                          onClick={() => startEdit(note)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-slate-500 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="Notu düzenle"
                        >
                          <Edit2 className="h-3 w-3" /> Düzenle
                        </button>
                        <button
                          onClick={() => setConfirmId(note.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Notu sil"
                        >
                          <Trash2 className="h-3 w-3" /> Sil
                        </button>
                      </>
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
