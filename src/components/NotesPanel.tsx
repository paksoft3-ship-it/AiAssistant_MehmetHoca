import { useState, useMemo } from 'react';
import { 
  Play, Volume2, Search, Edit2, Trash2, Check, X,
  Download, Copy, Share2, ClipboardCheck, ArrowUpRight
} from 'lucide-react';
import { Note } from '../types';

interface NotesPanelProps {
  notes: Note[];
  onPlaySingleNote: (note: Note) => void;
  onPlayAllNotes: () => void;
  onJumpToSentence: (pageNumber: number, lineNumber: number) => void;
  onEditNote: (id: string, newText: string) => void;
  onDeleteNote: (id: string) => void;
  currentArticleTitle?: string;
}

export default function NotesPanel({
  notes,
  onPlaySingleNote,
  onPlayAllNotes,
  onJumpToSentence,
  onEditNote,
  onDeleteNote,
  currentArticleTitle = 'Makale Notları',
}: NotesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Filter notes based on text search query
  const filteredNotes = useMemo(() => {
    return notes.filter(n => 
      n.noteText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.contextText.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  // Edit lifecycle
  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.noteText);
  };

  const handleSaveEdit = (id: string) => {
    if (editText.trim()) {
      onEditNote(id, editText);
    }
    setEditingId(null);
  };

  // Copy notes transcript to clipboard
  const handleCopyToClipboard = () => {
    if (notes.length === 0) return;
    
    const textBuffer = notes.map(n => {
      return `NOT #${n.number} [S. ${n.pageNumber}, Satır ${n.lineNumber}] - ${n.timestamp}\n` +
             `Referans Metin: "${n.contextText}"\n` +
             `Not: ${n.noteText}\n` +
             `-----------------------------------------`;
    }).join('\n\n');

    navigator.clipboard.writeText(
      `--- ${currentArticleTitle} Analiz Notları ---\n\n${textBuffer}`
    );
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download notes as TXT file
  const handleDownloadNotes = () => {
    if (notes.length === 0) return;

    const textBuffer = notes.map(n => {
      return `NOT #${n.number} [S. ${n.pageNumber}, Satır ${n.lineNumber}] - ${n.timestamp}\n` +
             `Referans Metin: "${n.contextText}"\n` +
             `Not: ${n.noteText}\n` +
             `-----------------------------------------`;
    }).join('\n\n');

    const fileContent = `--- ${currentArticleTitle} Analiz Notları ---\n\n${textBuffer}`;
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentArticleTitle.replace(/\s+/g, '_')}_notlar.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      
      {/* Header and Bulk Controls */}
      <div className="border-b border-slate-100 p-4.5 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>📝 Alınan Notlar</span>
              <span className="flex h-5 items-center justify-center rounded-full bg-indigo-50 px-2 text-2xs font-extrabold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                {notes.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Okurken tuttuğunuz interaktif notlar</p>
          </div>

          {/* Bulk Export & Play Controls */}
          {notes.length > 0 && (
            <div className="flex items-center space-x-1.5">
              {/* Play All Out loud */}
              <button
                onClick={onPlayAllNotes}
                className="flex items-center space-x-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-2xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer dark:bg-indigo-950/40 dark:text-indigo-300"
                title="Tüm notları ardışık seslendir"
                id="play-all-notes-btn"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Bütününü Oku</span>
              </button>

              {/* Copy */}
              <button
                onClick={handleCopyToClipboard}
                className={`p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer dark:border-slate-800 dark:hover:bg-slate-800 ${
                  isCopied ? 'text-green-600 bg-green-50/50 dark:text-green-400' : ''
                }`}
                title="Tümünü Kopyala"
                id="copy-all-notes-btn"
              >
                {isCopied ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>

              {/* Download */}
              <button
                onClick={handleDownloadNotes}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer dark:border-slate-800 dark:hover:bg-slate-800"
                title="Dosya Olarak İndir"
                id="download-all-notes-btn"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Searching field */}
        {notes.length > 0 && (
          <div className="relative mt-3">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Notlar veya referanslarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-1.8 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden bg-slate-50/30 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              id="search-notes-input"
            />
          </div>
        )}
      </div>

      {/* Notes Scrolling View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" id="notes-scrolling-container">
        
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div 
              key={note.id}
              className="group relative rounded-xl border border-slate-200/80 bg-white p-4 shadow-3xs transition hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900"
            >
              
              {/* Note meta bar */}
              <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-mono font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    #{note.number}
                  </span>
                  <button
                    onClick={() => onJumpToSentence(note.pageNumber, note.lineNumber)}
                    className="flex items-center space-x-0.5 rounded-sm bg-indigo-50/70 hover:bg-indigo-100/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-700 transition cursor-pointer dark:bg-indigo-950/40 dark:text-indigo-400"
                    title="Makaledeki bu satıra geri dön"
                  >
                    <span>S. {note.pageNumber}, Satır {note.lineNumber}</span>
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  </button>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{note.timestamp}</span>
              </div>

              {/* Reference snippet text */}
              <div className="mt-2 text-2xs italic text-slate-400 border-l border-slate-200 pl-2 dark:border-slate-800 max-h-16 overflow-hidden text-ellipsis line-clamp-2">
                &ldquo;{note.contextText}&rdquo;
              </div>

              {/* User Note Text Body (Editable or Read) */}
              <div className="mt-3">
                {editingId === note.id ? (
                  <div className="flex items-end space-x-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 min-h-[50px] rounded-lg border border-slate-200 p-2 text-xs focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      id={`edit-note-textarea-${note.id}`}
                    />
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded-md cursor-pointer dark:hover:bg-green-950/20"
                        title="Kaydet"
                        id={`save-edit-btn-${note.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-50 rounded-md cursor-pointer dark:hover:bg-slate-800"
                        title="İptal"
                        id={`cancel-edit-btn-${note.id}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed break-words font-sans">
                    {note.noteText}
                  </p>
                )}
              </div>

              {/* Action Buttons on hover/state */}
              <div className="mt-3.5 flex items-center justify-end space-x-2 border-t border-slate-100/50 pt-2.5 dark:border-slate-800">
                {/* Single Note TTS Speak button */}
                <button
                  onClick={() => onPlaySingleNote(note)}
                  className="flex items-center space-x-1 rounded-md px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800"
                  title="Notu sesli olarak dinle"
                  id={`play-single-note-${note.id}`}
                >
                  <Volume2 className="h-3 w-3" />
                  <span>Dinle</span>
                </button>

                {/* Edit */}
                <button
                  onClick={() => handleStartEdit(note)}
                  className="flex items-center space-x-1 rounded-md px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800"
                  title="Not Metnini Düzenle"
                  id={`edit-single-note-${note.id}`}
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Düzenle</span>
                </button>

                {/* Delete */}
                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="flex items-center space-x-1 rounded-md px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50 transition cursor-pointer dark:hover:bg-red-950/20"
                  title="Notu Sil"
                  id={`delete-single-note-${note.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Sil</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          /* Empty States notes */
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-200/50 dark:bg-slate-850 dark:border-slate-800">
              <Volume2 className="h-6 w-6 text-slate-300" />
            </div>
            <h4 className="mt-4 text-xs font-bold text-slate-800 dark:text-slate-200">
              Henüz Not Alınmadı
            </h4>
            <p className="mt-1 text-2xs text-slate-400 max-w-xs leading-relaxed">
              Okuma esnasında istediğiniz an <strong className="text-red-500">Dur, Not Alalım!</strong> butonuna basarak veya hands-free konuşarak sesli notlarınızı buraya kaydedebilirsiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
