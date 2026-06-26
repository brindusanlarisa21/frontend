import { useState } from 'react';
import Icon from './Icon';

/**
 * Input — text field with optional leading icon, label, prefix, and hint/error.
 * Minimalist: sunken-to-white field, hairline border, brand focus ring.
 */
function Input({ label, hint, error, leadingIcon, prefix, suffix, id, style, containerStyle, disabled, ...rest }) {
  const [focus, setFocus] = useState(false);
  const fieldId = id || (label ? `in-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const borderColor = error ? 'var(--danger)' : focus ? 'var(--brand)' : 'var(--border-default)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...containerStyle }}>
      {label && (
        <label htmlFor={fieldId} style={{ font: "var(--fw-semibold) var(--fs-sm)/1 'Inter', sans-serif", color: 'var(--text-body)' }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          height: 48,
          padding: '0 14px',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1.5px solid ${borderColor}`,
          borderRadius: 'var(--r-md)',
          boxShadow: focus ? 'var(--ring)' : 'none',
          transition: 'var(--t-control)',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {leadingIcon && <Icon name={leadingIcon} size={18} color="var(--text-subtle)" />}
        {prefix && <span style={{ color: 'var(--text-muted)', font: "var(--fw-medium) var(--fs-body)/1 'Inter',sans-serif" }}>{prefix}</span>}
        <input
          id={fieldId}
          disabled={disabled}
          onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            font: "var(--fw-medium) var(--fs-body)/1 'Inter', sans-serif",
            color: 'var(--text-strong)',
            padding: 0,
            ...style,
          }}
          {...rest}
        />
        {suffix && <span style={{ color: 'var(--text-muted)', font: "var(--fw-medium) var(--fs-sm)/1 'Inter',sans-serif" }}>{suffix}</span>}
      </div>
      {(hint || error) && (
        <span style={{ font: "var(--fw-regular) var(--fs-sm)/1.3 'Inter', sans-serif", color: error ? 'var(--danger)' : 'var(--text-muted)' }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

export default Input;
