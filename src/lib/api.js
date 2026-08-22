import { useEffect, useRef, useState } from 'react';

// Set at build time. Falls back to the deployed Worker so a plain `vite build`
// with no env still produces a working site.
export const WORKER_URL = (
  import.meta.env.VITE_WORKER_URL || 'https://mancity-hub-api.alecstanley.workers.dev'
).replace(/\/$/, '');

// Poll cadences, in ms. The Worker caps upstream calls independently -- these
// only decide how often the browser asks the Worker for its cached view.
const IDLE_MS = 10 * 60 * 1000; // no match in play
const LIVE_MS = 60 * 1000; // a match is in play

async function get(path, signal) {
  const res = await fetch(`${WORKER_URL}${path}`, { signal });
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json();
}

/**
 * The dashboard's single data source. One aggregated call gives every card its
 * data; a second, faster loop refreshes only the live match while one is on.
 *
 * Returns `{ feed, status, error, refresh }` where status is
 * 'loading' | 'ready' | 'error'. A failed refresh keeps the last good feed and
 * surfaces the error, so a blip never blanks a populated page.
 */
export function useFeed() {
  const [feed, setFeed] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const feedRef = useRef(null);

  // Bootstrap, then refresh on the idle cadence.
  useEffect(() => {
    const ac = new AbortController();
    let timer;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await get('/api/bootstrap', ac.signal);
        if (cancelled) return;
        feedRef.current = data;
        setFeed(data);
        setStatus('ready');
        setError(null);
      } catch (err) {
        if (cancelled || err.name === 'AbortError') return;
        setError(err);
        // Keep whatever we already have. A cold failure leaves every card in
        // its "Failed to fetch" state, which is the honest thing to show.
        setStatus(feedRef.current ? 'ready' : 'error');
      } finally {
        if (!cancelled) timer = setTimeout(load, IDLE_MS);
      }
    };

    load();
    return () => {
      cancelled = true;
      ac.abort();
      clearTimeout(timer);
    };
  }, [tick]);

  // Fast loop, only while a match is actually in play.
  const isLive = !!(feed && feed.live);
  useEffect(() => {
    if (!isLive) return undefined;
    const ac = new AbortController();
    const timer = setInterval(async () => {
      try {
        const live = await get('/api/live', ac.signal);
        setFeed((prev) => {
          const next = { ...(prev || {}), live: live.live || null };
          feedRef.current = next;
          return next;
        });
      } catch {
        /* a dropped live poll just means the score is stale for one interval */
      }
    }, LIVE_MS);
    return () => {
      clearInterval(timer);
      ac.abort();
    };
  }, [isLive]);

  return { feed, status, error, refresh: () => setTick((n) => n + 1) };
}

/**
 * A single club's identity and recent results, fetched only when a club page is
 * open. Kept out of the bootstrap payload because it is one club at a time and
 * would otherwise cost an upstream call for all twenty.
 */
export function useClubDetail(clubName, teamIds, active) {
  const [detail, setDetail] = useState(null);
  const id = teamIds && clubName ? teamIds[clubName] : null;

  useEffect(() => {
    if (!active || !id) {
      setDetail(null);
      return undefined;
    }
    const ac = new AbortController();
    let cancelled = false;
    get(`/api/club?id=${id}`, ac.signal)
      .then((data) => {
        if (cancelled) return;
        setDetail(data && data.detail ? { ...data.detail, recent: data.recent } : null);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [id, active]);

  return detail;
}
