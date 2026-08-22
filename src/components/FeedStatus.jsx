/**
 * The one piece of chrome the design export did not have: a quiet line telling
 * the supporter whether what they are reading is live. It follows the idle
 * bar's geometry and voice, and says nothing at all once data is flowing.
 */
export default function FeedStatus({ status, error, refresh }) {
  if (status === 'ready' && !error) return null;

  const loading = status === 'loading';
  const tone = loading ? 'var(--sky)' : 'var(--gold)';
  const message = loading
    ? 'FETCHING LIVE DATA'
    : status === 'error'
      ? 'LIVE DATA UNAVAILABLE · SHOWING SAMPLE FIGURES'
      : 'REFRESH FAILED · FIGURES MAY BE STALE';

  return (
    <div data-m="page" style={{ padding: '0 32px' }}>
      <div
        data-m="idle"
        role="status"
        aria-live="polite"
        style={{
          maxWidth: '1440px',
          margin: '0 auto 4px',
          minHeight: '34px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--dim)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '.12em',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: tone,
            flex: 'none',
            animation: loading ? 'cityPulse 1.4s ease-in-out infinite' : 'none',
          }}
        />
        <span>{message}</span>
        {!loading && (
          <button
            onClick={refresh}
            data-m="tap"
            data-hov="nav"
            style={{
              marginLeft: 'auto',
              height: '26px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'Archivo,sans-serif',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '.1em',
              color: 'var(--dim)',
            }}
          >
            RETRY
          </button>
        )}
      </div>
    </div>
  );
}
