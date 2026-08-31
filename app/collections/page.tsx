'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Inbox, Pin } from 'lucide-react';
import { api, describeError } from '@/lib/api';
import { useCollections, useCollectionsLoading } from '@/lib/useCollections';
import { invalidateJournalCaches } from '@/lib/dataInvalidation';
import { useI18n } from '@/lib/i18n';
import { CollectionIcon, COLLECTION_ICONS, DEFAULT_COLLECTION_ICON } from '@/components/icons';
import Modal from '@/components/Modal';

export default function CollectionsPage() {
  const { t } = useI18n();
  // The shared cache, not a page-local fetch: creating here and seeing the
  // sidebar's list update (and vice versa) both go through the same source
  // of truth instead of two independent copies that can drift apart.
  const collections = useCollections();
  const loading = useCollectionsLoading() && collections.length === 0;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(DEFAULT_COLLECTION_ICON);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.createCollection({ title: title.trim(), description: description.trim(), icon });
      setTitle('');
      setDescription('');
      setIcon(DEFAULT_COLLECTION_ICON);
      setOpen(false);
      invalidateJournalCaches(); // refetches the one shared list this page and the sidebar both read
    } catch (e) {
      setError(describeError(e, t.auth.errorCodes, t.common.somethingWentWrong));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t.collections.eyebrow}</div>
          <h1 className="page-title">{t.collections.title}</h1>
          <p className="page-sub">{t.collections.subtitle}</p>
        </div>
        <div className="head-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setOpen(true);
              setError(null);
            }}
          >
            {t.collections.newCollection}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 130 }} />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="empty empty-lg">
          <div className="empty-glyph">
            <Inbox size={26} strokeWidth={1.5} />
          </div>
          {t.collections.noneYet}
        </div>
      ) : (
        <div className="grid grid-3">
          {collections.map((col) => {
            const pct = col.total ? Math.round(((col.done ?? 0) / col.total) * 100) : 0;
            return (
              <Link key={col.id} href={`/collections/${col.id}`} className={`log-card ${col.pinned ? 'is-pinned' : ''}`}>
                <div className="log-card-top">
                  <div className="log-glyph">
                    <CollectionIcon icon={col.icon} size={19} />
                  </div>
                  {col.pinned && (
                    <span className="pill pill-pinned">
                      <Pin size={11} strokeWidth={2} /> {t.common.pinned}
                    </span>
                  )}
                </div>
                <div>
                  <div className="log-name">{col.title}</div>
                  {col.description && (
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                      {col.description}
                    </div>
                  )}
                </div>
                <div className="bar">
                  <span style={{ width: `${pct}%` }} />
                </div>
                <div className="stat-row">
                  <span>
                    <b>{col.total ?? 0}</b> {t.common.entries}
                  </span>
                  <span>
                    <b>{col.open ?? 0}</b> {t.common.open}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <h2>{t.collections.modalTitle}</h2>
          <div className="field">
            <label htmlFor="c-title">{t.collections.titleLabel}</label>
            <input
              id="c-title"
              value={title}
              autoFocus
              placeholder={t.collections.titlePlaceholder}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
            />
          </div>
          <div className="field">
            <label htmlFor="c-desc">{t.collections.descriptionLabel}</label>
            <input
              id="c-desc"
              value={description}
              placeholder={t.collections.descriptionPlaceholder}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.collections.iconLabel}</label>
            <div className="icon-picker">
              {COLLECTION_ICONS.map(({ id, Icon }) => (
                <button key={id} type="button" className={icon === id ? 'on' : ''} onClick={() => setIcon(id)}>
                  <Icon size={16} strokeWidth={1.8} />
                </button>
              ))}
            </div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="modal-actions">
            <button className="btn" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </button>
            <button className="btn btn-primary" onClick={create} disabled={saving || !title.trim()}>
              {saving ? t.common.saving : t.common.create}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
