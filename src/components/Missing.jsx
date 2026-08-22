/**
 * The honest empty state.
 *
 * This dashboard never shows a plausible-looking number it did not fetch. When
 * a value is missing -- the provider does not carry it, or the request failed
 * -- the panel keeps its place in the layout and says so, in the same quiet
 * register as the rest of the chrome.
 *
 * `variant` picks the shape:
 *   block  a card body, for a whole panel with nothing to show
 *   inline a short run of text, for one field inside a populated panel
 *   value  a headline figure, so a stat card keeps its baseline
 */
export default function Missing({ variant = 'block', label = 'Failed to fetch', note }) {
  if (variant === 'inline') {
    return (
      <span style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '.02em', color: 'var(--dim)', opacity: 0.75 }}>
        {label}
      </span>
    );
  }

  if (variant === 'value') {
    return (
      <span
        style={{
          fontFamily: 'Archivo,sans-serif',
          fontSize: '12.5px',
          fontWeight: 600,
          color: 'var(--dim)',
          opacity: 0.75,
          lineHeight: 1.2,
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '6px',
        minHeight: '96px',
        padding: '18px',
        borderRadius: '10px',
        background: 'var(--panel2)',
        border: '1px dashed var(--line)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--dim)', opacity: 0.6 }} />
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '.12em', color: 'var(--dim)' }}>
          {label.toUpperCase()}
        </span>
      </span>
      {note && (
        <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--dim)', opacity: 0.75, textWrap: 'pretty' }}>
          {note}
        </span>
      )}
    </div>
  );
}

/**
 * Render a value, or the failure state in its place. Use for a single field
 * inside a panel that otherwise has data.
 */
export function orMissing(value, label) {
  if (value === null || value === undefined || value === '') {
    return <Missing variant="inline" label={label || 'Failed to fetch'} />;
  }
  return value;
}
