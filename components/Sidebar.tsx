'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CircleHelp, Leaf, LogOut, Menu, Moon, Plus, ShieldCheck, Sun, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n, LOCALES } from '@/lib/i18n';
import { useTheme } from '@/lib/ThemeProvider';
import { useAuth } from '@/lib/AuthProvider';
import { nextThemeId } from '@/lib/theme';
import { CollectionIcon, LOG_ICONS } from './icons';
import HelpModal from './HelpModal';
import DeleteAccountModal from './DeleteAccountModal';
import type { Collection } from '@/lib/types';

const ONBOARDED_KEY = 'bujo:onboarded';

const THEME_ICONS = { paper: Sun, dusk: Moon, sage: Leaf } as const;

export default function Sidebar() {
  const pathname = usePathname();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const LOGS = [
    { href: '/', icon: LOG_ICONS.index, label: t.sidebar.logs.index },
    { href: '/future', icon: LOG_ICONS.future, label: t.sidebar.logs.future },
    { href: '/monthly', icon: LOG_ICONS.monthly, label: t.sidebar.logs.monthly },
    { href: '/weekly', icon: LOG_ICONS.weekly, label: t.sidebar.logs.weekly },
  ];

  useEffect(() => {
    let alive = true;
    api
      .collections()
      .then((data) => alive && setCollections(data))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // Re-read the list whenever the route changes, so new collections show up.
  }, [pathname]);

  // A route change means a nav link was just followed — close the mobile drawer.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Show the guided tour once, automatically, the first time someone opens the app.
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(ONBOARDED_KEY)) {
        setHelpOpen(true);
        window.localStorage.setItem(ONBOARDED_KEY, '1');
      }
    } catch {
      // localStorage unavailable — the "?" button still opens the same tour on demand.
    }
  }, []);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const ThemeIcon = THEME_ICONS[theme];

  return (
    <>
      <div className="mobile-topbar">
        <button type="button" className="hamburger-btn" title={t.sidebar.openMenu} onClick={() => setMobileOpen(true)}>
          <Menu size={20} strokeWidth={1.8} />
        </button>
        <Link href="/" className="brand">
          <div className="brand-mark">B</div>
          <div className="brand-name">Bujo</div>
        </Link>
      </div>

      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand-row">
          <Link href="/" className="brand">
            <div className="brand-mark">B</div>
            <div>
              <div className="brand-name">Bujo</div>
              <div className="brand-sub">{t.sidebar.brandSub}</div>
            </div>
          </Link>
          <button type="button" className="help-btn" title={t.help.openTitle} onClick={() => setHelpOpen(true)}>
            <CircleHelp size={19} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="sidebar-close"
            title={t.sidebar.closeMenu}
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

      <div className="sidebar-controls">
        <div className="lang-toggle" role="group" aria-label={t.language.toggleTitle}>
          {LOCALES.map((l) => (
            <button
              key={l.id}
              type="button"
              className={locale === l.id ? 'on' : ''}
              aria-pressed={locale === l.id}
              onClick={() => setLocale(l.id)}
            >
              {l.nativeName}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="theme-toggle"
          title={`${t.theme.toggleTitle}: ${t.theme[theme]}`}
          onClick={() => setTheme(nextThemeId(theme))}
        >
          <ThemeIcon size={15} strokeWidth={1.8} />
        </button>
      </div>

      <nav className="nav-group">
        <div className="nav-label">{t.sidebar.logsGroup}</div>
        {LOGS.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-item ${isActive(item.href) ? 'active' : ''}`}>
            <span className="nav-icon">
              <item.icon size={17} strokeWidth={1.8} />
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      <nav className="nav-group">
        <div className="nav-label">{t.sidebar.collectionsGroup}</div>
        {collections.map((col) => (
          <Link
            key={col.id}
            href={`/collections/${col.id}`}
            className={`nav-item ${pathname === `/collections/${col.id}` ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <CollectionIcon icon={col.icon} size={16} />
            </span>
            <span
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={col.title}
            >
              {col.title}
            </span>
            {typeof col.open === 'number' && col.open > 0 && <span className="nav-count">{col.open}</span>}
          </Link>
        ))}
        <Link href="/collections" className="nav-item">
          <span className="nav-icon">
            <Plus size={17} strokeWidth={1.8} />
          </span>
          {t.sidebar.newCollection}
        </Link>
      </nav>

      {user?.role === 'admin' && (
        <nav className="nav-group">
          <Link href="/admin" className={`nav-item ${pathname === '/admin' ? 'active' : ''}`}>
            <span className="nav-icon">
              <ShieldCheck size={17} strokeWidth={1.8} />
            </span>
            {t.admin.navLabel}
          </Link>
        </nav>
      )}

      <div className="sidebar-foot">
        <div style={{ marginBottom: 6 }}>
          <code>•</code> {t.sidebar.legend.task} &nbsp; <code>○</code> {t.sidebar.legend.event} &nbsp;{' '}
          <code>—</code> {t.sidebar.legend.note}
        </div>
        <div>
          <code>×</code> {t.sidebar.legend.done} &nbsp; <code>&gt;</code> {t.sidebar.legend.migrated} &nbsp;{' '}
          <code>&lt;</code> {t.sidebar.legend.scheduled}
        </div>
        <div className="legal-links">
          <Link href="/privacy">{t.auth.privacyPolicy}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms">{t.auth.termsOfService}</Link>
        </div>
      </div>

      {user && (
        <div className="sidebar-account">
          <div className="account-avatar">{(user.name || user.email)[0]?.toUpperCase()}</div>
          <div className="account-info">
            <div className="account-name" title={user.name || user.email}>
              {user.name || user.email}
            </div>
            <div className="account-email" title={user.email}>
              {user.email}
            </div>
          </div>
          <button
            type="button"
            className="act"
            title={t.auth.deleteAccount}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} strokeWidth={1.8} />
          </button>
          <button type="button" className="act" title={t.auth.logout} onClick={() => logout()}>
            <LogOut size={15} strokeWidth={1.8} />
          </button>
        </div>
      )}
    </aside>
    {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    {deleteOpen && <DeleteAccountModal onClose={() => setDeleteOpen(false)} />}
    </>
  );
}
