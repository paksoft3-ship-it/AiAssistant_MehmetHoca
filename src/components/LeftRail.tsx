import { Icon } from './ui/Icon';

export interface LeftRailProps {
  active: 'reader' | 'notes';
  onSelectReader: () => void;
  onSelectNotes: () => void;
  onSettings?: () => void;
}

function RailButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
        active
          ? 'border-l-2 border-primary bg-surface-muted text-primary'
          : 'text-text-muted hover:bg-surface-muted'
      }`}
    >
      <Icon name={icon} />
      <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded bg-slate-900 px-2 py-1 font-small text-small text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

/** Slim icon navigation rail on the left of the reader workspace (design §reader). */
export default function LeftRail({ active, onSelectReader, onSelectNotes, onSettings }: LeftRailProps) {
  return (
    <nav className="z-40 hidden w-16 shrink-0 flex-col items-center gap-4 border-r border-border bg-surface py-md lg:flex">
      <RailButton icon="visibility" label="Okuma Görünümü" active={active === 'reader'} onClick={onSelectReader} />
      <RailButton icon="edit_note" label="Notlarım" active={active === 'notes'} onClick={onSelectNotes} />
      <div className="flex-1" />
      <RailButton icon="settings" label="Gizlilik & Veriler" onClick={onSettings} />
    </nav>
  );
}
