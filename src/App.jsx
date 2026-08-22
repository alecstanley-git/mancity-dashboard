import { useEffect, useMemo, useState } from 'react';
import { buildModel } from './model/index.js';
import { useNav } from './hooks/useNav.js';
import { useOverlays } from './hooks/useOverlays.js';
import { useFeed, useClubDetail } from './lib/api.js';

import LiveBar from './components/LiveBar.jsx';
import IdleBar from './components/IdleBar.jsx';
import Header from './components/Header.jsx';
import TabBar from './components/TabBar.jsx';
import Footer from './components/Footer.jsx';
import FeedStatus from './components/FeedStatus.jsx';

import Overview from './pages/Overview.jsx';
import Fixtures from './pages/Fixtures.jsx';
import Squad from './pages/Squad.jsx';
import Tables from './pages/Tables.jsx';
import Player from './pages/Player.jsx';
import Club from './pages/Club.jsx';

const SUPPORTER = 'Alec';

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('cityHubTheme') || 'dark');
  useEffect(() => {
    localStorage.setItem('cityHubTheme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return [theme, setTheme];
}

export default function App() {
  const [theme, setTheme] = useTheme();
  const { state, nav } = useNav();
  const { feed, status, error, refresh } = useFeed();
  const clubDetail = useClubDetail(state.club, feed && feed.teamIds, state.page === 'Club');
  useOverlays(theme);

  // One tick a second, for the countdown only.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const v = useMemo(
    () =>
      buildModel({
        theme,
        supporterName: SUPPORTER,
        now,
        state,
        feed: { ...(feed || {}), clubDetail },
        nav: { ...nav, setTheme },
      }),
    [theme, now, state, feed, clubDetail, nav, setTheme]
  );

  return (
    <div
      data-m="root"
      data-theme={theme}
      style={{
        background: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'Archivo,Helvetica,sans-serif',
        minHeight: '100vh',
        paddingBottom: '72px',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {v.isLive && <LiveBar {...v} />}
      {v.isUpcoming && <IdleBar {...v} />}
      <Header {...v} />
      <FeedStatus status={status} error={error} refresh={refresh} live={v.isLive} />
      {v.isOverview && <Overview {...v} />}
      {v.isFixtures && <Fixtures {...v} />}
      {v.isSquad && <Squad {...v} />}
      {v.isTables && <Tables {...v} />}
      {v.isPlayer && <Player {...v} />}
      {v.isClub && <Club {...v} />}
      <TabBar {...v} />
      <Footer {...v} />
    </div>
  );
}
