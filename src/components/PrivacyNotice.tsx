import type { ReactNode } from 'react';
import { X, ShieldCheck, Database, Mic, Sparkles, Trash2 } from 'lucide-react';
import { PRODUCT } from '../config/product';

export interface PrivacyNoticeProps {
  isOpen: boolean;
  onClose: () => void;
  onClearData: () => void;
}

/**
 * In-app privacy notice (CLAUDE.md §17). States truthfully where data goes;
 * makes no "100% offline" or "fully private" claims for features that may use
 * online services.
 */
export default function PrivacyNotice({ isOpen, onClose, onClearData }: PrivacyNoticeProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 font-sans text-base font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Gizlilik ve Verileriniz
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <Item icon={<Database className="h-4 w-4 text-indigo-600" />} title="Yerel depolama">
            Belgeleriniz, notlarınız ve okuma konumunuz yalnızca bu tarayıcıda (IndexedDB) saklanır.
            Sunucuda saklanmaz. Tarayıcı verilerini temizlemek bunları silebilir; önemli notları dışa
            aktarmanız önerilir.
          </Item>
          <Item icon={<Mic className="h-4 w-4 text-indigo-600" />} title="Sesli okuma ve ses tanıma">
            Sesli okuma (TTS) cihazınızdaki seslere bağlıdır ve seslerin varlığı tarayıcı/işletim
            sistemine göre değişir. Ses tanıma (dikte) bazı tarayıcılarda çevrim içi hizmetlerle
            işlenebilir; bu nedenle &ldquo;tamamen çevrimdışı&rdquo; olduğunu iddia etmiyoruz.
          </Item>
          <Item icon={<Sparkles className="h-4 w-4 text-indigo-600" />} title="Yapay zeka özellikleri">
            Not düzenleme, çeviri ve tartışma gibi yapay zeka özellikleri yalnızca gerekli metni
            (seçili pasaj, ham notunuz, belge başlığı) sunucu üzerinden yapay zeka servisine gönderir.
            Tüm kütüphaneniz gönderilmez. Bu özellikleri hiç kullanmadan okuyabilir ve not alabilirsiniz.
            API anahtarı yalnızca sunucuda tutulur.
          </Item>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            {PRODUCT.name}, desteklenmeyen bir özellik için &ldquo;%100 gizli&rdquo; ya da
            &ldquo;garantili premium ses&rdquo; gibi iddialarda bulunmaz.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <button
            onClick={onClearData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/20"
          >
            <Trash2 className="h-4 w-4" />
            Verilerimi Sil
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}

function Item({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex-none">{icon}</div>
      <div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h4>
        <p className="mt-0.5 text-[13px]">{children}</p>
      </div>
    </div>
  );
}
