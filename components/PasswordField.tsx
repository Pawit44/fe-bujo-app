'use client';

import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/** A password `<input>` with a show/hide toggle — used everywhere a
 * password is typed (login, register, delete-account confirm) so mistyping
 * it is never a "clear and hope" guessing game. */
export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  placeholder,
  autoFocus,
  onKeyDown,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  /** Rendered below the input, e.g. a "min 8 characters" note. */
  hint?: ReactNode;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="password-toggle"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          title={visible ? t.auth.hidePassword : t.auth.showPassword}
          aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
        >
          {visible ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
        </button>
      </div>
      {hint}
    </div>
  );
}
