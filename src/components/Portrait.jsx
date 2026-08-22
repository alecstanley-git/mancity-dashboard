import { useState } from 'react';

/**
 * A player portrait, with a fallback chain.
 *
 * Neither portrait source is complete, and neither fails cleanly: the Premier
 * League's CDN answers 403 for some recent signings rather than 404, and ESPN
 * simply has no headshot for others. A CSS background cannot detect either, so
 * the card would render blank. An <img> can, so the sources are tried in turn
 * and the striped placeholder is what remains if both fail — the same approach
 * `Badge.jsx` takes to a dead crest.
 */
export default function Portrait({ src, alt, name, zoom = 1, focus = 'center top', children }) {
  const sources = [src, alt].filter(Boolean);
  const [i, setI] = useState(0);
  const current = sources[i] || null;

  return (
    <>
      {current && (
        <img
          src={current}
          alt=""
          loading="lazy"
          onError={() => setI((n) => n + 1)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: focus,
            display: 'block',
            // The Premier League ships 500x500 headshots with the player small
            // in frame. Dropped into a small square that reads as an empty
            // circle, so a tight crop zooms past the margin onto the face.
            ...(zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: 'center 34%' } : null),
          }}
        />
      )}
      {!current && name && (
        <span
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace',
            fontSize: '10px',
            letterSpacing: '.06em',
            color: 'var(--dim)',
            background: 'var(--panel)',
            padding: '4px 8px',
            borderRadius: '5px',
          }}
        >
          {name}
        </span>
      )}
      {children}
    </>
  );
}
