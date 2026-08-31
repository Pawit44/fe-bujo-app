'use client';

import { RotateCcw, Sparkles, Star } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import Modal from './Modal';

export default function HelpModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();

  const bulletRows: [string, string][] = [
    ['•', t.index.legend.task],
    ['○', t.index.legend.event],
    ['—', t.index.legend.note],
    ['×', t.index.legend.completed],
    ['>', t.index.legend.migrated],
    ['<', t.index.legend.scheduled],
  ];

  const shorthandRows = [
    { symbol: t.help.shorthandRows.priority[0], label: t.help.shorthandRows.priority[1], Icon: Star },
    { symbol: t.help.shorthandRows.inspiration[0], label: t.help.shorthandRows.inspiration[1], Icon: Sparkles },
    { symbol: t.help.shorthandRows.event[0], label: t.help.shorthandRows.event[1] },
    { symbol: t.help.shorthandRows.note[0], label: t.help.shorthandRows.note[1] },
  ];

  return (
    <Modal onClose={onClose} className="modal-help">
      <h2>{t.help.title}</h2>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 20 }}>
          {t.help.intro}
        </p>

        <div className="help-section">
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            {t.help.bulletKeyTitle}
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
            {t.help.bulletKeyIntro}
          </p>
          <div className="help-grid">
            {bulletRows.map(([symbol, label]) => (
              <div key={label} className="help-row">
                <code>{symbol}</code>
                <span>{label}</span>
              </div>
            ))}
            <div className="help-row">
              <Star size={13} strokeWidth={1.8} />
              <span>{t.index.legend.priority}</span>
            </div>
            <div className="help-row">
              <Sparkles size={13} strokeWidth={1.8} />
              <span>{t.index.legend.inspiration}</span>
            </div>
          </div>
        </div>

        <div className="help-section">
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            {t.help.shorthandTitle}
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
            {t.help.shorthandIntro}
          </p>
          <div className="help-grid">
            {shorthandRows.map((row) => (
              <div key={row.label} className="help-row">
                {row.Icon ? <row.Icon size={13} strokeWidth={1.8} /> : <code>{row.symbol}</code>}
                <span>{row.label}</span>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
            {t.help.shorthandExample}
          </p>
        </div>

        <div className="help-section">
          <div className="eyebrow" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={12} strokeWidth={2} />
            {t.help.reviewTitle}
          </div>
          <p className="muted" style={{ fontSize: 12.5 }}>
            {t.help.reviewIntro}
          </p>
        </div>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={onClose}>
          {t.help.close}
        </button>
      </div>
    </Modal>
  );
}
