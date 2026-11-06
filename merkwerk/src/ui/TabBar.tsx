import { Link } from './components';
import { Icon } from './icons';
import { TABS } from './tabs';
import { LogoMark } from './Logo';

export function TabBar({ pathname }: { pathname: string }) {
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      <div className="rail-logo">
        <LogoMark size={40} />
      </div>
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className="tab"
          aria-current={pathname === tab.to ? 'page' : undefined}
        >
          <Icon name={tab.icon} />
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
