import { useEffect, useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { Portal } from '../../../components/ui/Portal';
import { historyRepository } from '../../../db/repositories';
import type { HistoryEvent } from '../../../types/domain';
import { describeEvent, formatEventTime } from '../services/historyFormat';

export interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Activity-history timeline (Beta spec §22), with a privacy-aware clear action. */
export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setConfirmClear(false);
    void historyRepository.list().then((list) => {
      setEvents(list);
      setLoading(false);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = async () => {
    await historyRepository.clear();
    setEvents([]);
    setConfirmClear(false);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/20 p-md backdrop-blur-md sm:p-lg" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-title"
          className="flex max-h-[92vh] w-full max-w-[32rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-lg py-md">
            <h2 id="history-title" className="flex items-center gap-sm font-h3-card-title text-h3-card-title text-on-surface dark:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon name="history" className="text-[20px]" />
              </span>
              Etkinlik Geçmişi
            </h2>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-on-surface" aria-label="Kapat">
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-lg">
            {loading ? (
              <p className="py-lg text-center font-small text-small text-text-muted">Yükleniyor…</p>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center py-xl text-center">
                <Icon name="history_toggle_off" className="text-[40px] text-text-muted" />
                <p className="mt-md font-small text-small text-text-muted">Henüz etkinlik kaydı yok.</p>
              </div>
            ) : (
              <ol className="space-y-md">
                {events.map((e) => {
                  const d = describeEvent(e);
                  return (
                    <li key={e.id} className="flex gap-md">
                      <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surface-muted text-text-muted">
                        <Icon name={d.icon} className="text-[16px]" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-small text-small text-on-surface dark:text-slate-200">
                          {d.label}
                          {d.detail && <span className="text-text-muted"> — {d.detail}</span>}
                        </p>
                        <p className="font-label-mono text-label-mono text-text-muted">{formatEventTime(e.createdAt)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {events.length > 0 && (
            <div className="flex items-center justify-between gap-sm border-t border-border px-lg py-md">
              <p className="font-label-mono text-label-mono text-text-muted">Geçmiş yalnızca bu cihazda tutulur.</p>
              {confirmClear ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-small text-small text-danger">Tüm geçmiş silinsin mi?</span>
                  <button onClick={handleClear} className="rounded-md bg-danger px-2 py-1 font-label-mono text-label-mono text-on-error">Evet</button>
                  <button onClick={() => setConfirmClear(false)} className="rounded-md px-2 py-1 font-label-mono text-label-mono text-text-muted hover:bg-surface-muted">Vazgeç</button>
                </div>
              ) : (
                <button onClick={() => setConfirmClear(true)} className="inline-flex items-center gap-1.5 rounded-btn border border-danger/30 px-3 py-1.5 font-small text-small text-danger transition-colors hover:bg-danger-soft">
                  <Icon name="delete_sweep" className="text-[18px]" /> Geçmişi Temizle
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
