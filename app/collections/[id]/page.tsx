'use client';

import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { Pin, PinOff, Trash2 } from 'lucide-react';
import EntryList from '@/components/EntryList';
import ErrorToast from '@/components/ErrorToast';
import { api } from '@/lib/api';
import { useEntries } from '@/lib/useEntries';
import { invalidateCollections } from '@/lib/useCollections';
import { useI18n } from '@/lib/i18n';
import { CollectionIcon } from '@/components/icons';
import Modal from '@/components/Modal';
import type { Collection } from '@/lib/types';

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n();
  const { id } = use(params);
  const collectionId = Number(id);
  const router = useRouter();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [all, setAll] = useState<Collection[]>([]);
  const [confirming, setConfirming] = useState(false);

  const journal = useEntries({ logKind: 'collection', collectionId });

  useEffect(() => {
    api.collection(collectionId).then(setCollection).catch(() => undefined);
    api.collections().then(setAll).catch(() => undefined);
  }, [collectionId]);

  const remove = async () => {
    await api.deleteCollection(collectionId);
    invalidateCollections(); // drop it from the sidebar's cached list
    router.push('/collections');
    router.refresh();
  };

  const togglePin = async () => {
    if (!collection) return;
    const saved = await api.updateCollection(collectionId, { pinned: !collection.pinned });
    setCollection(saved);
    invalidateCollections(); // pinning reorders the sidebar
  };

  const open = journal.entries.filter((e) => e.status === 'open').length;
  const done = journal.entries.filter((e) => e.status === 'done').length;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t.collection.eyebrow}</div>
          <h1 className="page-title collection-title">
            {collection && <CollectionIcon icon={collection.icon} size={30} />}
            {collection ? collection.title : '…'}
          </h1>
          <p className="page-sub">{collection?.description || t.collection.defaultDescription}</p>
        </div>
        <div className="head-actions">
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
          <button className="btn btn-sm" onClick={() => setConfirming(true)}>
            <Trash2 size={14} strokeWidth={1.8} /> {t.common.delete}
          </button>
        </div>
      </header>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">{t.collection.entriesTitle}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="pill">
              {open} {t.common.open}
            </span>
            <span className="pill">
              {done} {t.common.done}
            </span>
          </div>
        </div>
        <div style={{ padding: '12px 14px 18px' }}>
          <EntryList
            entries={journal.entries}
            collections={all}
            context={{ logKind: 'collection', collectionId }}
            onAdd={journal.add}
            onToggle={journal.toggle}
            onUpdate={journal.update}
            onDelete={journal.remove}
            onMigrate={journal.migrate}
            onReorder={journal.reorder}
          />
        </div>
      </section>

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
