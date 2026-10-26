import { useState } from "react";
import { Icon, type IconName } from "./components/Icon";
import { RestProvider } from "./components/RestTimer";
import { ToastProvider } from "./components/Toast";
import { useTheme } from "./lib/hooks";
import { href, useRoute, type RouteName } from "./lib/router";
import { didPersistFail, useAppState } from "./lib/store";
import { FuelScreen } from "./screens/Fuel";
import { GuideScreen } from "./screens/Guide";
import { PlanScreen } from "./screens/Plan";
import { ProgressScreen } from "./screens/Progress";
import { SettingsSheet } from "./screens/Settings";
import { TodayScreen } from "./screens/Today";

const NAV: { name: RouteName; label: string; icon: IconName }[] = [
  { name: "today", label: "Today", icon: "today" },
  { name: "plan", label: "Plan", icon: "plan" },
  { name: "progress", label: "Progress", icon: "progress" },
  { name: "fuel", label: "Fuel", icon: "fuel" },
  { name: "guide", label: "Guide", icon: "guide" },
];

function Brand() {
  return (
    <a className="brand" href={href("today")} aria-label="Iron Plan, go to Today">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="var(--rubber)" />
        <circle cx="16" cy="16" r="11.5" fill="var(--blue)" />
        <circle cx="16" cy="16" r="8" fill="none" stroke="#fff" strokeOpacity=".35" />
        <circle cx="16" cy="16" r="3" fill="var(--rubber)" />
      </svg>
      <span className="display t-md">Iron Plan</span>
    </a>
  );
}

export default function App() {
  const state = useAppState();
  useTheme(state.settings.theme);
  const route = useRoute();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <ToastProvider>
      <RestProvider>
        <div className="shell">
          <header className="topbar">
            <Brand />
            <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
              <Icon name="settings" />
            </button>
          </header>

          <aside className="rail">
            <Brand />
            <nav aria-label="Main">
              <ul className="rail-nav">
                {NAV.map((n) => (
                  <li key={n.name}>
                    <a className="rail-link" href={href(n.name)} aria-current={route.name === n.name ? "page" : undefined}>
                      <Icon name={n.icon} />
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <button className="rail-link rail-settings" onClick={() => setSettingsOpen(true)}>
              <Icon name="settings" />
              Settings
            </button>
          </aside>

          <main className="main" id="main">
            {didPersistFail() && (
              <div className="notice notice-warn" role="alert">
                <Icon name="alert" size={20} />
                <span>Your browser is blocking storage, so changes won’t be kept after you close this tab. Download a backup from Settings to be safe.</span>
              </div>
            )}
            <div className="page">
              {route.name === "today" && <TodayScreen dateParam={route.param} />}
              {route.name === "plan" && <PlanScreen param={route.param} />}
              {route.name === "progress" && <ProgressScreen />}
              {route.name === "fuel" && <FuelScreen />}
              {route.name === "guide" && <GuideScreen />}
            </div>
          </main>

          <nav className="tabbar" aria-label="Main">
            {NAV.map((n) => (
              <a key={n.name} className="tab" href={href(n.name)} aria-current={route.name === n.name ? "page" : undefined}>
                <Icon name={n.icon} size={24} />
                <span>{n.label}</span>
              </a>
            ))}
          </nav>
        </div>
        <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </RestProvider>
    </ToastProvider>
  );
}
