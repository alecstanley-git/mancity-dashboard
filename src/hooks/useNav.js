import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL = {
  comp: 'PL',
  page: 'Overview',
  player: 'Erling Haaland',
  club: 'Arsenal',
  fromPage: 'Squad',
};

/**
 * Navigation state plus its history mirror. One history entry per navigation,
 * so Android's hardware back and the in-page "Back to X" button walk the same
 * stack. pushState carries no URL, so the host URL is untouched.
 *
 * Every page change must go through `go()` -- calling setState directly would
 * silently break the back button.
 */
export function useNav() {
  const [state, setState] = useState(INITIAL);
  const depth = useRef(0);
  // The openers need the page the user is leaving in order to set `fromPage`.
  // Reading it from a ref keeps them free of side effects inside a state
  // updater, which StrictMode would otherwise run twice.
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    if (!window.history || !window.history.pushState) return undefined;
    try {
      window.history.replaceState({ cityHub: INITIAL }, '');
    } catch {
      /* history unavailable; in-page back still works via fromPage */
    }
    const pop = (e) => {
      const st = e.state && e.state.cityHub;
      depth.current = Math.max(0, depth.current - 1);
      setState((prev) => (st ? { ...prev, ...st } : { ...prev, page: 'Overview' }));
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);

  const go = useCallback((patch) => {
    setState((prev) => {
      const next = {
        ...prev,
        page: patch.page !== undefined ? patch.page : prev.page,
        player: patch.player !== undefined ? patch.player : prev.player,
        club: patch.club !== undefined ? patch.club : prev.club,
        fromPage: patch.fromPage !== undefined ? patch.fromPage : prev.fromPage,
      };
      if (next.page === prev.page && next.player === prev.player && next.club === prev.club) return prev;
      if (window.history && window.history.pushState) {
        try {
          window.history.pushState(
            { cityHub: { page: next.page, player: next.player, club: next.club, fromPage: next.fromPage } },
            ''
          );
          depth.current += 1;
        } catch {
          /* ignore: navigation still works, only the back stack is shallower */
        }
      }
      window.scrollTo(0, 0);
      return next;
    });
  }, []);

  const openClub = useCallback(
    (name) => {
      if (!name) return;
      const s = latest.current;
      go({ page: 'Club', club: name, fromPage: s.page === 'Club' || s.page === 'Player' ? s.fromPage : s.page });
    },
    [go]
  );

  const openPlayer = useCallback(
    (name) => {
      if (!name) return;
      const s = latest.current;
      go({ page: 'Player', player: name, fromPage: s.page === 'Player' ? s.fromPage : s.page });
    },
    [go]
  );

  const goBack = useCallback(() => {
    if (depth.current > 0) {
      window.history.back();
      return;
    }
    go({ page: latest.current.fromPage || 'Squad' });
  }, [go]);

  const setComp = useCallback((comp) => setState((s) => ({ ...s, comp })), []);

  return { state, nav: { go, openClub, openPlayer, goBack, setComp } };
}
