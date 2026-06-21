import type { ReactNode } from 'react';
import { Icon } from './ui/Icon';
import { Portal } from './ui/Portal';
import { PRODUCT } from '../config/product';

export interface PrivacyNoticeProps {
  isOpen: boolean;
  onClose: () => void;
  onClearData: () => void;
}

/**
 * In-app privacy notice (CLAUDE.md §17). States truthfully where data goes;
 * makes no "100% offline" / "fully private" claims for features that may use
 * online services.
 */
export default function PrivacyNotice({ isOpen, onClose, onClearData }: PrivacyNoticeProps) {
  if (!isOpen) return null;

  return (
    <Portal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/20 p-md backdrop-blur-md sm:p-lg">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-lg py-md dark:bg-slate-900">
          <h3 className="flex items-center gap-sm font-h3-card-title text-h3-card-title text-on-surface dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft text-success">
              <Icon name="shield" className="text-[20px]" />
            </span>
            Gizlilik ve Verileriniz
          </h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-on-surface" aria-label="Kapat">
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-lg overflow-y-auto p-lg">
          <Item icon="database" title="Yerel depolama">
            Belgeleriniz, notlarınız ve okuma konumunuz yalnızca bu tarayıcıda (IndexedDB) saklanır.
            Sunucuda saklanmaz. Tarayıcı verilerini temizlemek bunları silebilir; önemli notları dışa
            aktarmanız önerilir.
          </Item>
          <Item icon="mic" title="Sesli okuma ve ses tanıma">
            Sesli okuma (TTS) cihazınızdaki seslere bağlıdır ve seslerin varlığı tarayıcı/işletim
            sistemine göre değişir. Ses tanıma (dikte) bazı tarayıcılarda çevrim içi hizmetlerle
            işlenebilir; bu nedenle &ldquo;tamamen çevrimdışı&rdquo; olduğunu iddia etmiyoruz.
          </Item>
          <Item icon="auto_awesome" title="Yapay zeka özellikleri">
            Not düzenleme, çeviri ve tartışma gibi yapay zeka özellikleri yalnızca gerekli metni
            (seçili pasaj, ham notunuz, belge başlığı) sunucu üzerinden yapay zeka servisine gönderir.
            Tüm kütüphaneniz gönderilmez. Bu özellikleri hiç kullanmadan okuyabilir ve not alabilirsiniz.
            API anahtarı yalnızca sunucuda tutulur.
          </Item>
          <p className="font-small text-small text-text-muted">
            {PRODUCT.name}, desteklenmeyen bir özellik için &ldquo;%100 gizli&rdquo; ya da
            &ldquo;garantili premium ses&rdquo; gibi iddialarda bulunmaz.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-sm border-t border-border px-lg py-md">
          <button onClick={onClearData} className="inline-flex items-center gap-1.5 rounded-btn border border-danger/30 px-4 py-2 font-small text-small font-medium text-danger transition-colors hover:bg-danger-soft">
            <Icon name="delete" className="text-[18px]" />
            Verilerimi Sil
          </button>
          <button onClick={onClose} className="rounded-btn bg-primary px-5 py-2 font-small text-small font-medium text-on-primary transition-colors hover:bg-primary-hover">
            Anladım
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}

function Item({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-md">
      <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon name={icon} className="text-[18px]" />
      </span>
      <div>
        <h4 className="font-small text-small font-bold text-on-surface dark:text-white">{title}</h4>
        <p className="mt-0.5 font-small text-small text-text-muted">{children}</p>
      </div>
    </div>
  );
}
