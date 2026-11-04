import { Suspense, lazy, useCallback, useEffect, useState, type ComponentType } from 'react';
import { matchPath, navigate, useLocation } from './lib/router';
import { useReducedMotion } from './lib/motion';
import { useSave } from './state/store';
import { Home } from './screens/Home';
import { PatternDefs } from './ui/Shape';
import { Splash } from './ui/Splash';
import { TabBar } from './ui/TabBar';
import { TAB_PATHS } from './ui/tabs';
import { UpdateToast } from './ui/UpdateToast';
import { Loading } from './ui/Loading';

export interface RouteProps {
  params: Record<string, string>;
  search: string;
}

const named = <K extends string>(
  loader: () => Promise<Record<K, ComponentType<RouteProps>>>,
  name: K,
) => lazy(async () => ({ default: (await loader())[name] }));

const WorldMap = named(() => import('./screens/WorldMap'), 'WorldMap');
const LevelIntro = named(() => import('./screens/LevelIntro'), 'LevelIntro');
const PlayLevel = named(() => import('./screens/Play'), 'PlayLevel');
const PlayTraining = named(() => import('./screens/Play'), 'PlayTraining');
const PlayDaily = named(() => import('./screens/Play'), 'PlayDaily');
const Result = named(() => import('./screens/Result'), 'Result');
const Training = named(() => import('./screens/Training'), 'Training');
const Stats = named(() => import('./screens/Stats'), 'Stats');
const Achievements = named(() => import('./screens/Achievements'), 'Achievements');
const Settings = named(() => import('./screens/Settings'), 'Settings');
const Onboarding = named(() => import('./screens/Onboarding'), 'Onboarding');
const Impressum = named(() => import('./screens/Legal'), 'Impressum');
const Datenschutz = named(() => import('./screens/Legal'), 'Datenschutz');
const NotFound = named(() => import('./screens/NotFound'), 'NotFound');

const ROUTES: { pattern: string; component: ComponentType<RouteProps> }[] = [
  { pattern: '/', component: Home },
  { pattern: '/willkommen', component: Onboarding },
  { pattern: '/karte', component: WorldMap },
  { pattern: '/level/:id', component: LevelIntro },
  { pattern: '/spiel/level/:id', component: PlayLevel },
  { pattern: '/spiel/training/:mode', component: PlayTraining },
  { pattern: '/spiel/tagesaufgabe', component: PlayDaily },
  { pattern: '/ergebnis', component: Result },
  { pattern: '/training', component: Training },
  { pattern: '/statistik', component: Stats },
  { pattern: '/erfolge', component: Achievements },
  { pattern: '/einstellungen', component: Settings },
  { pattern: '/impressum', component: Impressum },
  { pattern: '/datenschutz', component: Datenschutz },
];

function resolve(pathname: string): {
  component: ComponentType<RouteProps>;
  params: Record<string, string>;
} {
  for (const route of ROUTES) {
    const params = matchPath(route.pattern, pathname);
    if (params) return { component: route.component, params };
  }
  return { component: NotFound, params: {} };
}

const SPLASH_KEY = 'merkwerk.startbild';

/** Das Startbild erscheint einmal pro Sitzung, nicht bei jedem Neuladen. */
function shouldShowSplash(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_KEY) === null;
  } catch {
    return true;
  }
}

export function App() {
  const location = useLocation();
  const save = useSave();
  const reducedMotion = useReducedMotion();
  const [splash, setSplash] = useState(shouldShowSplash);
  const hideSplash = useCallback(() => {
    setSplash(false);
    try {
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      // ohne sessionStorage erscheint das Startbild eben bei jedem Laden
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
  }, [reducedMotion]);

  useEffect(() => {
    document.documentElement.dataset.patterns = save.settings.colorPatterns ? 'on' : 'off';
  }, [save.settings.colorPatterns]);

  const needsOnboarding = !save.onboardingDone && location.pathname === '/';
  useEffect(() => {
    if (needsOnboarding) navigate('/willkommen', { replace: true });
  }, [needsOnboarding]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const { component: Screen, params } = resolve(location.pathname);
  const withTabs = TAB_PATHS.has(location.pathname) && save.onboardingDone;

  return (
    <>
      <a className="skip-link" href="#inhalt">
        Zum Inhalt springen
      </a>
      <PatternDefs />
      {withTabs ? <TabBar pathname={location.pathname} /> : null}
      <main id="inhalt" className={`app-main ${withTabs ? 'with-tabs' : ''}`}>
        <div className="screen" key={location.pathname}>
          <Suspense fallback={<Loading />}>
            {needsOnboarding ? <Loading /> : <Screen params={params} search={location.search} />}
          </Suspense>
        </div>
      </main>
      <UpdateToast />
      {splash ? <Splash onDone={hideSplash} /> : null}
    </>
  );
}
