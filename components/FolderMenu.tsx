'use client';

import { useEffect, useRef, useState } from 'react';
import { Folder as FolderIcon, FolderMinus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { Folder } from '@/lib/types';

/**
 * "Move to folder" for one entry inside a collection — a flat pick from that
 * collection's folders (plus "no folder," to move it back to the collection's
 * unsorted area). Only ever shown inside a collection's own page, since
 * folders don't mean anything outside one.
 */
export default function FolderMenu({
  folders,
  currentFolderId,
  onMove,
}: {
  folders: Folder[];
  currentFolderId: number | null;
  onMove: (folderId: number | null) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const pick = (folderId: number | null) => {
    setOpen(false);
    if (folderId === currentFolderId) return;
    onMove(folderId);
  };

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        type="button"
        className="act"
        onClick={() => setOpen((v) => !v)}
        title={t.collection.moveToFolder}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <FolderIcon size={14} strokeWidth={1.8} />
      </button>

      {open && (
        <div className="menu" role="menu">
          <div className="menu-label">{t.collection.moveToFolder}</div>
          <button className="menu-item" onClick={() => pick(null)} disabled={currentFolderId === null}>
            <FolderMinus size={14} strokeWidth={1.8} /> {t.collection.unsorted}
          </button>
          {folders.length > 0 && <div className="menu-sep" />}
          {folders.map((folder) => (
            <button
              key={folder.id}
              className="menu-item"
              onClick={() => pick(folder.id)}
              disabled={currentFolderId === folder.id}
            >
              <FolderIcon size={14} strokeWidth={1.8} /> {folder.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
