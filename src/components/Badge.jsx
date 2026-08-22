import { useState } from 'react';

/**
 * A club badge. When the feed carries a real crest URL (API-Football serves
 * these, so they stay current on their own) it renders the image; otherwise it
 * falls back to the coloured disc and three-letter code the design shipped
 * with. A broken image URL falls back to the disc too, so a dead CDN never
 * leaves a hole in the layout.
 */
export default function Badge({ src, code, bg, fg, size, border, fontSize }) {
  const [failed, setFailed] = useState(false);
  const px = `${size}px`;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{
          width: px,
          height: px,
          flex: 'none',
          objectFit: 'contain',
          display: 'block',
          ...(border ? { border, borderRadius: '50%', background: '#fff', padding: '4px' } : null),
        }}
      />
    );
  }

  return (
    <span
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        color: fg,
        fontFamily: "'Barlow Condensed',sans-serif",
        fontSize: `${fontSize || Math.round(size * 0.34)}px`,
        fontWeight: 700,
        ...(border ? { border } : null),
      }}
    >
      {code || "\u2014"}
    </span>
  );
}
