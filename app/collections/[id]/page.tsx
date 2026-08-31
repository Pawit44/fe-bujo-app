'use client';

import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { FolderPlus, Pencil, Pin, PinOff, Trash2, Folder as FolderIcon } from 'lucide-react';
import EntryList from '@/components/EntryList';
import ErrorToast from '@/components/ErrorToast';
import { api, describeError } from '@/lib/api';
import { useEntries } from '@/lib/useEntries';
import { useCollections } from '@/lib/useCollections';
import { invalidateJournalCaches } from '@/lib/dataInvalidation';
import { useI18n } from '@/lib/i18n';
import { CollectionIcon } from '@/components/icons';
import Modal from '@/components/Modal';
import type { Collection, Folder } from '@/lib/types';

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n();
  const { id } = use(params);
  const collectionId = Number(id);
  const router = useRouter();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // The full list, for EntryList's "migrate to another collection" picker —
  // the shared cache, so it's already warm from the sidebar and stays in
  // sync with any rename/pin done elsewhere instead of a separate copy.
  const all = useCollections();

  const journal = useEntries({ logKind: 'collection', collectionId });

  // Folders are scoped to this one page — nothing else in the app needs
  // them — so a plain local fetch is enough; they don't need the shared,
  // cross-page cache collections and the overview get.
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderModal, setFolderModal] = useState<'create' | Folder | null>(null);
  const [folderTitle, setFolderTitle] = useState('');
  const [folderSaving, setFolderSaving] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);

  const reloadFolders = useCallback(() => {
    api
      .folders(collectionId)
      .then(setFolders)
      .catch(() => undefined);
  }, [collectionId]);

  useEffect(() => {
    setCollection(null);
    setNotFound(false);
    api
      .collection(collectionId)
      .then(setCollection)
      .catch(() => setNotFound(true));
    reloadFolders();
  }, [collectionId, reloadFolders]);

  const remove = async () => {
    try {
      await api.deleteCollection(collectionId);
      invalidateJournalCaches(); // drops it from the sidebar, and its entries from the Index totals
      router.push('/collections');
      router.refresh();
    } catch (e) {
      setConfirming(false);
      journal.setError(e instanceof Error ? e.message : t.common.somethingWentWrong);
    }
  };

  const togglePin = async () => {
    if (!collection) return;
    try {
      const saved = await api.updateCollection(collectionId, { pinned: !collection.pinned });
      setCollection(saved);
      invalidateJournalCaches(); // pinning reorders the sidebar
    } catch (e) {
      journal.setError(e instanceof Error ? e.message : t.common.somethingWentWrong);
    }
  };

  const saveFolder = async () => {
    if (!folderTitle.trim()) return;
    setFolderSaving(true);
    setFolderError(null);
    try {
      if (folderModal === 'create') {
        await api.createFolder(collectionId, folderTitle.trim());
      } else if (folderModal) {
        await api.updateFolder(folderModal.id, { title: folderTitle.trim() });
      }
      reloadFolders();
      setFolderModal(null);
      setFolderTitle('');
    } catch (e) {
      setFolderError(describeError(e, t.auth.errorCodes, t.common.somethingWentWrong));
    } finally {
      setFolderSaving(false);
    }
  };

  const deleteFolder = async () => {
    if (!deletingFolder) return;
    try {
      await api.deleteFolder(deletingFolder.id);
      setDeletingFolder(null);
      reloadFolders();
      journal.reload(); // its entries just moved back to unsorted
    } catch (e) {
      journal.setError(e instanceof Error ? e.message : t.common.somethingWentWrong);
    }
  };

  const unsortedEntries = useMemo(() => journal.entries.filter((e) => e.folderId === null), [journal.entries]);
  const entriesByFolder = useMemo(() => {
    const map = new Map<number, typeof journal.entries>();
    for (const folder of folders) map.set(folder.id, []);
    for (const e of journal.entries) {
      if (e.folderId !== null) map.get(e.folderId)?.push(e);
    }
    return map;
  }, [journal.entries, folders]);

  const open = journal.entries.filter((e) => e.status === 'open').length;
  const done = journal.entries.filter((e) => e.status === 'done').length;

  if (notFound) {
    return (
      <div className="page">
        <div className="empty empty-lg">{t.collection.notFound}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        {collection ? (
          <div>
            <div className="eyebrow">{t.collection.eyebrow}</div>
            <h1 className="page-title collection-title">
              <CollectionIcon icon={collection.icon} size={30} />
              {collection.title}
            </h1>
            <p className="page-sub">{collection.description || t.collection.defaultDescription}</p>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 14, width: 90, marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 32, width: 240, marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 14, width: 320 }} />
          </div>
        )}
        <div className="head-actions">
          <button
            className="btn btn-sm"
            onClick={() => {
              setFolderModal('create');
              setFolderTitle('');
              setFolderError(null);
            }}
            disabled={!collection}
          >
            <FolderPlus size={14} strokeWidth={1.8} /> {t.collection.newFolder}
          </button>
          <button className="btn btn-sm" onClick={togglePin} disabled={!collection}>
            {collection?.pinned ? (
              <>
                <PinOff size={14} strokeWidth={1.8} /> {t.collection.pinned}
              </>
            ) : (
              <>
                <Pin size={14} strokeWidth={1.8} /> {t.collection.pin}
              </>
            )}
          </button>
          <button className="btn btn-sm" onClick={() => setConfirming(true)} disabled={!collection}>
            <Trash2 size={14} strokeWidth={1.8} /> {t.common.delete}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {folders.map((folder) => {
          const folderEntries = entriesByFolder.get(folder.id) ?? [];
          const folderOpen = folderEntries.filter((e) => e.status === 'open').length;
          return (
            <section key={folder.id} className="card">
              <div className="card-head">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FolderIcon size={16} strokeWidth={1.8} style={{ color: 'var(--ink-faint)' }} />
                  {folder.title}
                </h2>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="pill">
                    {folderOpen} {t.common.open}
                  </span>
                  <button
                    type="button"
                    className="act"
                    title={t.collection.renameFolder}
                    onClick={() => {
                      setFolderModal(folder);
                      setFolderTitle(folder.title);
                      setFolderError(null);
                    }}
                  >
                    <Pencil size={13} strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    className="act danger"
                    title={t.collection.deleteFolder}
                    onClick={() => setDeletingFolder(folder)}
                  >
                    <Trash2 size={13} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
              <div style={{ padding: '8px 14px 18px' }}>
                <EntryList
                  entries={folderEntries}
                  collections={all}
                  context={{ logKind: 'collection', collectionId, folderId: folder.id }}
                  onAdd={journal.add}
                  onToggle={journal.toggle}
                  onUpdate={journal.update}
                  onDelete={journal.remove}
                  onMigrate={journal.migrate}
                  onReorder={journal.reorder}
                  folders={folders}
                  onMoveFolder={journal.moveToFolder}
                />
              </div>
            </section>
          );
        })}

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">{folders.length > 0 ? t.collection.unsorted : t.collection.entriesTitle}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="pill">
                {open} {t.common.open}
              </span>
              <span className="pill">
                {done} {t.common.done}
              </span>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 12, padding: '12px 14px 0' }}>
            {t.collection.addNote}
          </p>
          <div style={{ padding: '8px 14px 18px' }}>
            <EntryList
              entries={unsortedEntries}
              collections={all}
              context={{ logKind: 'collection', collectionId, folderId: null }}
              onAdd={journal.add}
              onToggle={journal.toggle}
              onUpdate={journal.update}
              onDelete={journal.remove}
              onMigrate={journal.migrate}
              onReorder={journal.reorder}
              folders={folders}
              onMoveFolder={journal.moveToFolder}
            />
          </div>
        </section>
      </div>

      {folderModal && (
        <Modal onClose={() => setFolderModal(null)}>
          <h2>{folderModal === 'create' ? t.collection.newFolder : t.collection.renameFolder}</h2>
          <div className="field">
            <label htmlFor="folder-title">{t.collections.titleLabel}</label>
            <input
              id="folder-title"
              value={folderTitle}
              autoFocus
              placeholder={t.collection.folderTitlePlaceholder}
              onChange={(e) => setFolderTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveFolder()}
            />
          </div>
          {folderError && <div className="auth-error">{folderError}</div>}
          <div className="modal-actions">
            <button className="btn" onClick={() => setFolderModal(null)}>
              {t.common.cancel}
            </button>
            <button className="btn btn-primary" onClick={saveFolder} disabled={folderSaving || !folderTitle.trim()}>
              {folderSaving ? t.common.saving : t.common.create}
            </button>
          </div>
        </Modal>
      )}

      {deletingFolder && (
        <Modal onClose={() => setDeletingFolder(null)}>
          <h2>{t.collection.deleteFolderTitle}</h2>
          <p className="muted" style={{ fontSize: 13.5 }}>
            {t.collection.deleteFolderBody(deletingFolder.title)}
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setDeletingFolder(null)}>
              {t.common.cancel}
            </button>
            <button className="btn btn-primary" onClick={deleteFolder}>
              {t.common.delete}
            </button>
          </div>
        </Modal>
      )}

      {confirming && (
        <Modal onClose={() => setConfirming(false)}>
          <h2>{t.collection.deleteTitle}</h2>
          <p className="muted" style={{ fontSize: 13.5 }}>
            {t.collection.deleteBody(collection?.title ?? '', journal.entries.length)}
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setConfirming(false)}>
              {t.common.cancel}
            </button>
            <button className="btn btn-primary" onClick={remove}>
              {t.common.delete}
            </button>
          </div>
        </Modal>
      )}
      <ErrorToast message={journal.error} onDismiss={() => journal.setError(null)} />
    </div>
  );
}
