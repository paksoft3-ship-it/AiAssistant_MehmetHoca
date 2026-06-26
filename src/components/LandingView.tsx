import { useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';
import { Icon } from './ui/Icon';
import WaitlistForm from '../features/waitlist/components/WaitlistForm';
import { formatFileSize } from '../utils/documentParser';
import type { LibraryEntry } from '../features/documents/services/documentService';
import type { ResearchProject } from '../types/domain';
import { type LibrarySortKey, progressRatio } from '../features/library/services/libraryQueries';

export interface LandingViewProps {
  isParsing: boolean;
  parsingPercent: number;
  parsingError: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onInputFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onLoadSample: () => void;
  onImportUrl: (url: string) => void;
  libraryEntries: LibraryEntry[];
  totalLibraryCount: number;
  librarySearch: string;
  onLibrarySearch: (v: string) => void;
  libraryLang: string;
  onLibraryLang: (v: string) => void;
  libraryLanguages: string[];
  librarySort: LibrarySortKey;
  onLibrarySort: (v: LibrarySortKey) => void;
  onOpenDocument: (id: string) => void;
  onRemoveDocument: (id: string) => void;
  onOpenHowItWorks: () => void;
  /** Document to offer for "Okumaya Devam Et" (null = none started yet). */
  continueEntry: LibraryEntry | null;
  onContinue: (id: string) => void;
  // Projects + activity (Beta Phase 5)
  projects: ResearchProject[];
  projectFilter: string;
  onProjectFilter: (id: string) => void;
  onCreateProject: (name: string) => void | Promise<void>;
  onRemoveProject: (id: string) => void | Promise<void>;
  onAssignProject: (documentId: string, projectId: string | null) => void | Promise<void>;
  onOpenHistory: () => void;
  onOpenInvite: () => void;
  onOpenAssistant: () => void;
  onOpenAccessibility: () => void;
}

const FAQ = [
  {
    q: 'Hangi belge formatlarını destekliyorsunuz?',
    a: 'PDF (metin tabanlı), DOCX ve TXT formatlarını destekliyoruz. Taranmış (görüntü) PDF’lerde metin çıkarılamaz; OCR henüz yoktur.',
  },
  {
    q: 'Yapay zeka özelliklerini kullanmak zorunda mıyım?',
    a: 'Hayır. Okuma, kaynağa bağlı not alma ve dışa aktarma yapay zeka olmadan tamamen çalışır. Not düzenleme, çeviri ve tartışma isteğe bağlıdır.',
  },
  {
    q: 'Belgelerim ve notlarım güvende mi?',
    a: 'Belgeleriniz ve notlarınız yalnızca tarayıcınızda (IndexedDB) saklanır; sunucuya yüklenmez. İstediğiniz an yerel verilerinizi silebilirsiniz.',
  },
  {
    q: 'Sesli okuma ve dikte her cihazda aynı mı?',
    a: 'Hayır. Sesler ve ses tanıma tarayıcı/işletim sistemine bağlıdır. Belirli bir “premium” sesi garanti etmeyiz ve ses tanımanın tamamen çevrimdışı olduğunu iddia etmeyiz.',
  },
];

function languageLabel(lang: string) {
  return lang === 'tr' ? 'TR' : lang === 'en' ? 'EN' : lang.toUpperCase();
}

function formatLastOpened(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function LandingView(props: LandingViewProps) {
  const {
    isParsing, parsingPercent, parsingError, fileInputRef, onInputFileChange, onDragOver, onDrop,
    onLoadSample, onImportUrl, libraryEntries, totalLibraryCount, librarySearch, onLibrarySearch, libraryLang,
    onLibraryLang, libraryLanguages, librarySort, onLibrarySort, onOpenDocument, onRemoveDocument,
    onOpenHowItWorks, continueEntry, onContinue,
    projects, projectFilter, onProjectFilter, onCreateProject, onRemoveProject, onAssignProject,
    onOpenHistory, onOpenInvite, onOpenAssistant, onOpenAccessibility,
  } = props;

  const [urlValue, setUrlValue] = useState('');
  const [newProject, setNewProject] = useState('');
  const projectName = (id?: string) => projects.find((p) => p.id === id)?.name;
  const submitProject = () => {
    const v = newProject.trim();
    if (v) { void onCreateProject(v); setNewProject(''); }
  };
  const submitUrl = () => {
    const v = urlValue.trim();
    if (v && !isParsing) onImportUrl(v);
  };

  return (
    <main id="main-content" className="mx-auto flex max-w-7xl flex-col gap-xl px-lg py-xl">
      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-lg py-xl text-center">
        <span className="rounded-full border border-primary-fixed-dim bg-primary-soft px-4 py-1.5 font-label-mono text-label-mono text-primary">
          EidosUs — Aktif Okuma &amp; Araştırma Notları
        </span>
        <h1 className="font-display-hero text-display-hero leading-tight text-deep-navy dark:text-white">
          Makaleyi dinleyin, durun, düşüncenizi söyleyin — kaynağa bağlı araştırma notuna dönüşsün.
        </h1>
        <p className="max-w-2xl font-body-reading text-body-reading text-text-muted">
          PDF, DOCX veya TXT belgenizi yükleyin. Okurken zihninizde beliren fikirleri konuşarak
          kaydedin, EidosUs bunları anında akademik referanslı notlara dönüştürsün.
        </p>
        <button
          type="button"
          onClick={onOpenHowItWorks}
          className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-surface px-4 py-2 font-small text-small font-medium text-text transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary dark:bg-slate-900"
        >
          <Icon name="play_circle" className="text-[18px]" />
          Nasıl Çalıştığını Gör
        </button>
      </section>

      {/* Continue reading — resume the last started document at its saved spot */}
      {continueEntry && (() => {
        const doc = continueEntry.document;
        const percent = Math.round(progressRatio(continueEntry) * 100);
        const page = doc.lastReadAnchor?.pageNumber;
        const lastOpened = formatLastOpened(doc.lastOpenedAt);
        return (
          <section aria-label="Okumaya devam et" className="mx-auto w-full max-w-3xl">
            <div className="flex flex-col gap-md rounded-card border border-primary/20 bg-primary-soft p-lg sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="flex items-center gap-1.5 font-label-mono text-label-mono uppercase tracking-widest text-primary">
                  <Icon name="resume" className="text-[16px]" />
                  Okumaya Devam Et
                </span>
                <h2 className="truncate font-h3-card-title text-h3-card-title text-deep-navy dark:text-white">{doc.title}</h2>
                <div className="flex flex-wrap items-center gap-x-md gap-y-1 font-small text-small text-text-muted">
                  {page != null && <span>Sayfa {page}{doc.pageCount ? ` / ${doc.pageCount}` : ''}</span>}
                  {percent > 0 && <span>%{percent} tamamlandı</span>}
                  {lastOpened && <span>Son açılma: {lastOpened}</span>}
                  {continueEntry.noteCount > 0 && <span>{continueEntry.noteCount} not</span>}
                </div>
                {percent > 0 && (
                  <div
                    className="mt-1 h-1.5 w-full max-w-[20rem] overflow-hidden rounded-full bg-surface"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onContinue(doc.id)}
                className="inline-flex flex-none items-center justify-center gap-1.5 rounded-btn bg-primary px-5 py-2.5 font-small text-small font-medium text-on-primary transition-colors hover:bg-primary-hover"
              >
                <Icon name="play_arrow" className="text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }} />
                Devam Et
              </button>
            </div>
          </section>
        );
      })()}

      {/* Upload */}
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-md">
        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => !isParsing && fileInputRef.current?.click()}
          className="group flex cursor-pointer flex-col items-center justify-center gap-md rounded-card border-2 border-dashed border-outline-variant bg-surface p-xl text-center transition-colors hover:bg-surface-muted dark:border-slate-700 dark:bg-slate-900"
        >
          {isParsing ? (
            <div className="flex flex-col items-center gap-md py-sm">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-surface-muted border-t-primary" />
                <Icon name="description" className="absolute text-[28px] text-primary" />
              </div>
              <div>
                <h3 className="font-h3-card-title text-h3-card-title text-on-surface dark:text-white">Belge Analiz Ediliyor…</h3>
                <p className="mt-1 font-label-mono text-label-mono text-text-muted">%{parsingPercent}</p>
              </div>
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${parsingPercent}%` }} />
              </div>
            </div>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft transition-colors group-hover:bg-primary-fixed-dim">
                <Icon name="upload_file" className="text-[32px] text-primary" />
              </div>
              <div className="flex flex-col gap-xs">
                <h3 className="font-h3-card-title text-h3-card-title text-on-surface dark:text-white">Akademik Belgeyi Buraya Bırakın veya Seçin</h3>
                <span className="font-small text-small text-text-muted">Desteklenen formatlar: PDF, DOCX, TXT</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="mt-sm rounded-btn bg-primary px-6 py-3 font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-focus-ring focus:ring-offset-2"
              >
                Cihazdan Dosya Seç
              </button>
            </>
          )}
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={onInputFileChange} className="hidden" />
        </div>

        {parsingError && (
          <div className="flex items-start gap-sm rounded-card border border-danger-soft bg-danger-soft p-lg text-left dark:border-red-900/30 dark:bg-red-950/20">
            <Icon name="error" className="mt-0.5 text-[20px] text-danger" />
            <div>
              <h4 className="text-small font-bold text-danger">Ayrıştırma Hatası</h4>
              <p className="mt-0.5 font-small text-small text-danger">{parsingError}</p>
            </div>
          </div>
        )}

        {/* Import from link */}
        <div className="flex flex-col gap-sm rounded-card border border-border bg-surface p-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-sm">
            <Icon name="link" className="text-[20px] text-primary" />
            <h3 className="font-h3-card-title text-h3-card-title text-on-surface dark:text-white">Linkten İçerik Ekle</h3>
          </div>
          <p className="font-small text-small text-text-muted">
            Herkese açık bir makale sayfası veya PDF bağlantısı yapıştırın. İçerik sunucumuz üzerinden
            güvenle alınır. Ödeme duvarı arkasındaki veya giriş gerektiren sayfalar desteklenmez.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); submitUrl(); }}
            className="flex flex-col gap-sm sm:flex-row"
          >
            <input
              type="url"
              inputMode="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://ornek.com/makale"
              aria-label="İçe aktarılacak bağlantı"
              className="min-w-0 flex-1 rounded-btn border border-border bg-surface px-4 py-2.5 font-small text-small outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring dark:bg-slate-950 dark:text-slate-200"
            />
            <button
              type="submit"
              disabled={isParsing || !urlValue.trim()}
              className="inline-flex flex-none items-center justify-center gap-1.5 rounded-btn bg-primary px-5 py-2.5 font-small text-small font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted"
            >
              <Icon name="download" className="text-[18px]" />
              İçe Aktar
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center justify-between gap-md rounded-card border border-primary-fixed-dim bg-primary-soft p-lg sm:flex-row dark:border-indigo-900/30 dark:bg-indigo-950/20">
          <div className="flex items-center gap-md">
            <Icon name="description" className="text-[24px] text-primary" />
            <span className="font-medium text-primary">Bilgisayarımda makale dökümanı yok</span>
          </div>
          <button
            onClick={onLoadSample}
            className="whitespace-nowrap rounded-btn border border-primary-fixed-dim bg-surface px-4 py-2 font-medium text-primary transition-colors hover:bg-surface-muted dark:bg-slate-900"
          >
            Örnek Makaleyle Dene
          </button>
        </div>
      </section>

      {/* Tools: activity history + invite (always reachable) */}
      <section className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-sm">
        <button
          type="button"
          onClick={onOpenHistory}
          className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-surface px-4 py-2 font-small text-small font-medium text-text transition-colors hover:bg-surface-muted dark:bg-slate-900"
        >
          <Icon name="history" className="text-[18px]" /> Etkinlik Geçmişi
        </button>
        <button
          type="button"
          onClick={onOpenInvite}
          className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-surface px-4 py-2 font-small text-small font-medium text-text transition-colors hover:bg-surface-muted dark:bg-slate-900"
        >
          <Icon name="group_add" className="text-[18px]" /> Arkadaşını Davet Et
        </button>
        <button
          type="button"
          onClick={onOpenAssistant}
          className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-surface px-4 py-2 font-small text-small font-medium text-text transition-colors hover:bg-surface-muted dark:bg-slate-900"
        >
          <Icon name="assistant" className="text-[18px]" /> Asistan Ayarları
        </button>
        <button
          type="button"
          onClick={onOpenAccessibility}
          className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-surface px-4 py-2 font-small text-small font-medium text-text transition-colors hover:bg-surface-muted dark:bg-slate-900"
        >
          <Icon name="accessibility_new" className="text-[18px]" /> Erişilebilirlik
        </button>
      </section>

      {/* Library */}
      {totalLibraryCount > 0 && (
        <section id="library" className="mt-xl flex flex-col gap-lg scroll-mt-24">
          <div className="flex flex-col items-start justify-between gap-md border-b border-border pb-md sm:flex-row sm:items-end">
            <h2 className="font-h2-section-title text-h2-section-title text-on-surface dark:text-white">Belge Kütüphaneniz</h2>
            <div className="flex flex-wrap gap-sm">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted" />
                <input
                  value={librarySearch}
                  onChange={(e) => onLibrarySearch(e.target.value)}
                  placeholder="Ara…"
                  className="w-full rounded-btn border border-border bg-surface py-2 pl-10 pr-4 text-sm outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring sm:w-64 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>
              {libraryLanguages.length > 1 && (
                <select
                  value={libraryLang}
                  onChange={(e) => onLibraryLang(e.target.value)}
                  className="rounded-btn border border-border bg-surface px-4 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-focus-ring dark:bg-slate-900 dark:text-slate-300"
                >
                  <option value="">Tüm Diller</option>
                  {libraryLanguages.map((l) => (
                    <option key={l} value={l}>{l === 'tr' ? 'Türkçe' : l === 'en' ? 'İngilizce' : l.toUpperCase()}</option>
                  ))}
                </select>
              )}
              <select
                value={librarySort}
                onChange={(e) => onLibrarySort(e.target.value as LibrarySortKey)}
                className="rounded-btn border border-border bg-surface px-4 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-focus-ring dark:bg-slate-900 dark:text-slate-300"
              >
                <option value="recent">En Yeni</option>
                <option value="title">A-Z</option>
                <option value="notes">En Çok Not</option>
                <option value="progress">İlerleme</option>
              </select>
            </div>
          </div>

          {/* Projects: filter + create */}
          <div className="flex flex-wrap items-center gap-sm">
            <button
              onClick={() => onProjectFilter('')}
              className={`rounded-full px-3 py-1 font-small text-small transition-colors ${projectFilter === '' ? 'border border-primary/20 bg-primary-soft font-medium text-primary' : 'border border-border bg-surface text-text-muted hover:bg-surface-muted'}`}
            >
              Tüm Belgeler
            </button>
            {projects.map((p) => (
              <span key={p.id} className={`inline-flex items-center gap-1 rounded-full pl-3 pr-1 py-1 font-small text-small transition-colors ${projectFilter === p.id ? 'border border-primary/20 bg-primary-soft text-primary' : 'border border-border bg-surface text-text-muted'}`}>
                <button onClick={() => onProjectFilter(projectFilter === p.id ? '' : p.id)} className="font-medium">
                  {p.name}
                </button>
                <button onClick={() => onRemoveProject(p.id)} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-danger-soft hover:text-danger" title="Projeyi sil" aria-label={`${p.name} projesini sil`}>
                  <Icon name="close" className="text-[14px]" />
                </button>
              </span>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); submitProject(); }} className="flex items-center gap-1">
              <input
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="Yeni proje…"
                aria-label="Yeni proje adı"
                className="w-32 rounded-full border border-dashed border-border bg-surface px-3 py-1 font-small text-small outline-none focus:border-focus-ring focus:ring-1 focus:ring-focus-ring dark:bg-slate-900"
              />
              <button type="submit" disabled={!newProject.trim()} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-40" title="Proje ekle" aria-label="Proje ekle">
                <Icon name="add" className="text-[18px]" />
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-md">
            {libraryEntries.length === 0 && (
              <p className="py-6 text-center font-small text-small text-text-muted">Eşleşen belge bulunamadı.</p>
            )}
            {libraryEntries.map(({ document: doc, noteCount }, idx) => (
              <div
                key={doc.id}
                className="flex flex-col items-start justify-between gap-md rounded-card border border-border bg-surface p-lg transition-colors hover:border-primary-fixed-dim sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-1 items-start gap-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted font-label-mono text-label-mono text-text-muted dark:bg-slate-800">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="flex flex-col gap-xs">
                    <h3 className="line-clamp-1 font-h3-card-title text-h3-card-title text-on-surface dark:text-white">{doc.title}</h3>
                    <div className="flex flex-wrap items-center gap-xs font-label-mono text-label-mono text-text-muted">
                      <span className="rounded border border-border bg-surface-muted px-2 py-0.5 uppercase dark:bg-slate-800">{doc.fileType}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.fileSizeBytes)}</span>
                      <span>•</span>
                      <span>{languageLabel(doc.language)}</span>
                      {noteCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-primary">{noteCount} NOT</span>
                        </>
                      )}
                      {doc.sourceDomain && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-0.5"><Icon name="link" className="text-[12px]" />{doc.sourceDomain}</span>
                        </>
                      )}
                      {projectName(doc.projectId) && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-0.5 text-primary"><Icon name="folder" className="text-[12px]" />{projectName(doc.projectId)}</span>
                        </>
                      )}
                    </div>
                    {projects.length > 0 && (
                      <select
                        value={doc.projectId ?? ''}
                        onChange={(e) => void onAssignProject(doc.id, e.target.value || null)}
                        aria-label="Projeye ata"
                        className="mt-1 w-fit rounded-btn border border-border bg-surface px-2 py-1 font-label-mono text-label-mono text-text-muted outline-none focus:ring-1 focus:ring-focus-ring dark:bg-slate-900"
                      >
                        <option value="">Projesiz</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex w-full items-center gap-sm sm:mt-0 sm:w-auto">
                  <button
                    onClick={() => onOpenDocument(doc.id)}
                    className="flex-1 whitespace-nowrap rounded-btn border border-border bg-surface px-4 py-2 font-medium text-text transition-colors hover:bg-surface-muted sm:flex-none dark:bg-slate-900 dark:text-slate-200"
                  >
                    Okumaya Devam Et
                  </button>
                  <button
                    onClick={() => onRemoveDocument(doc.id)}
                    className="shrink-0 rounded-btn border border-transparent p-2 text-text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                    title="Belgeyi ve notlarını sil"
                  >
                    <Icon name="delete" className="text-[20px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how" className="mt-xl flex flex-col gap-lg border-t border-border py-xl scroll-mt-24">
        <div className="mx-auto flex max-w-2xl flex-col gap-sm text-center">
          <span className="font-label-mono text-label-mono uppercase tracking-widest text-primary">Nasıl Çalışır?</span>
          <h2 className="font-h2-section-title text-h2-section-title text-deep-navy dark:text-white">Akademik odaklanmayı bölmeden not alın</h2>
        </div>
        <div className="mt-lg grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-4">
          {[
            ['Dinle ve Aktif Oku', 'Makaleyi doğal seslerle dinlerken, görsel olarak metni takip edin.'],
            ['Pasaj Seç Notunu Söyle', 'Önemli bir yer geldiğinde durdurun, pasajı seçin ve düşüncelerinizi sesli kaydedin.'],
            ['Kaynağa Bağla', 'Sesli notunuz metne dökülür ve seçtiğiniz referans pasajla otomatik ilişkilendirilir.'],
            ['Düzenle ve Sakla', 'Tüm notlarınızı belgeler bazında görüntüleyin, düzenleyin ve dışa aktarın.'],
          ].map(([title, body], i) => (
            <div key={title} className="flex flex-col gap-md rounded-card border border-border bg-surface p-lg dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">{i + 1}</div>
              <h3 className="font-h3-card-title text-h3-card-title text-on-surface dark:text-white">{title}</h3>
              <p className="font-small text-small text-text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who is it for */}
      <section className="flex flex-col items-center gap-md py-lg">
        <span className="font-label-mono text-label-mono uppercase tracking-widest text-text-muted">Kimler İçin?</span>
        <div className="flex flex-wrap justify-center gap-sm">
          {['Yüksek Lisans / Doktora Öğrencileri', 'Araştırmacılar ve Akademisyenler', 'Uzun Akademik Metinlerle Çalışanlar'].map((w) => (
            <span key={w} className="rounded-full border border-border bg-surface px-4 py-2 font-small text-small text-text dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{w}</span>
          ))}
        </div>
      </section>

      {/* Waitlist + FAQ */}
      <section className="mt-lg grid grid-cols-1 gap-xl border-t border-border py-xl lg:grid-cols-12">
        <div id="waitlist" className="flex scroll-mt-24 lg:col-span-5">
          <div className="flex w-full flex-col gap-md rounded-card border border-border bg-surface p-xl shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-h2-section-title text-h2-section-title text-deep-navy dark:text-white">Ücretsiz Beta'ya katılın</h3>
            <p className="mb-sm font-small text-small text-text-muted">
              EidosUs şu anda erken erişim aşamasında. Gelişim sürecine katkı sağlamak için e-posta adresinizi bırakın.
            </p>
            <WaitlistForm />
          </div>
        </div>
        <div id="faq" className="flex scroll-mt-24 flex-col gap-sm lg:col-span-7">
          <h3 className="mb-sm font-h3-card-title text-h3-card-title text-deep-navy dark:text-white">Sıkça Sorulan Sorular</h3>
          {FAQ.map((item) => (
            <details key={item.q} className="group cursor-pointer rounded-lg border border-border bg-surface p-4 dark:border-slate-800 dark:bg-slate-900">
              <summary className="flex list-none items-center justify-between font-medium text-text outline-none dark:text-slate-200">
                {item.q}
                <Icon name="expand_more" className="text-text-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 pr-8 font-small text-small leading-relaxed text-text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
