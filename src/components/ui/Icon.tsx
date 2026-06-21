import type { CSSProperties } from 'react';

/**
 * Material Symbols (Outlined) icon — matches the approved design's iconography.
 * Size is controlled by font-size utilities (e.g. text-[18px]).
 */
export function Icon({
  name,
  className = '',
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={style} aria-hidden="true">
      {name}
    </span>
  );
}
