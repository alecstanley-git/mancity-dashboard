/**
 * News feed. Neither source needs a key or counts against the football API
 * budget, so this is fetched on a short TTL and merged newest-first.
 */

const FEEDS = [
  { url: 'https://feeds.bbci.co.uk/sport/football/teams/manchester-city/rss.xml', source: 'BBC Sport' },
  { url: 'https://www.theguardian.com/football/manchestercity/rss', source: 'The Guardian' },
];

const decode = (s = '') =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();

const pick = (block, tag) => {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block);
  return m ? decode(m[1]) : '';
};

const pickAttr = (block, tag, attr) => {
  const m = new RegExp(`<${tag}[^>]*\\b${attr}="([^"]+)"`).exec(block);
  return m ? m[1] : null;
};

function kickerFor(title, link) {
  const t = title.toLowerCase();
  if (/\/(sounds|videos?|av)\//.test(link)) return { kicker: 'VIDEO', isVideo: true };
  if (/transfer|sign(s|ing|ed)?\b|deal|bid|loan|contract/.test(t)) return { kicker: 'TRANSFER', isVideo: false };
  if (/injur|fitness|ruled out|sidelined|doubt|return/.test(t)) return { kicker: 'SQUAD', isVideo: false };
  if (/\b\d\s*-\s*\d\b|beat|thrash|held|defeat|win over|draw with/.test(t)) return { kicker: 'MATCH REPORT', isVideo: false };
  if (/guardiola|pep says|press conference|interview/.test(t)) return { kicker: 'PRESS', isVideo: false };
  return { kicker: 'NEWS', isVideo: false };
}

function ago(iso) {
  const then = new Date(iso).getTime();
  if (!then) return '';
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function parseFeed(xml, source) {
  const items = [];
  const blocks = xml.split(/<item[\s>]/).slice(1);
  for (const raw of blocks) {
    const block = raw.slice(0, raw.indexOf('</item>') + 1 || undefined);
    const link = pick(block, 'link');
    let title = pick(block, 'title');
    const description = pick(block, 'description');

    // BBC titles every audio/video item just "Manchester City"; the real
    // headline is in the description, so prefer that when the title is the
    // club name alone.
    if (!title || /^manchester city$/i.test(title)) title = description;
    if (!title) continue;

    const image =
      pickAttr(block, 'media:thumbnail', 'url') ||
      pickAttr(block, 'media:content', 'url') ||
      pickAttr(block, 'enclosure', 'url');

    const pubDate = pick(block, 'pubDate') || pick(block, 'dc:date');
    const { kicker, isVideo } = kickerFor(title, link);

    items.push({
      kicker,
      isVideo,
      title,
      url: link,
      image,
      source,
      time: ago(pubDate),
      ts: new Date(pubDate).getTime() || 0,
      slot: 'news photo 16:10',
    });
  }
  return items;
}

export async function fetchNews(ctx, limit = 8) {
  const cache = caches.default;
  const key = new Request('https://city-hub.internal/news');
  const hit = await cache.match(key);
  if (hit) return hit.json();

  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const res = await fetch(f.url, { headers: { 'user-agent': 'city-hub/1.0 (+personal dashboard)' } });
      if (!res.ok) throw new Error(`${f.source} HTTP ${res.status}`);
      return parseFeed(await res.text(), f.source);
    })
  );

  const items = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit);

  if (!items.length) return null;

  ctx.waitUntil(
    cache.put(
      key,
      new Response(JSON.stringify(items), {
        headers: { 'content-type': 'application/json', 'cache-control': 'max-age=900' },
      })
    )
  );
  return items;
}
