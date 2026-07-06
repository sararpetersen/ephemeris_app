import { useEffect, useState } from "react";
import { AuthPage, type AuthState } from "./components/AuthPage";
import { Onboarding } from "./components/Onboarding";
import { Home } from "./components/Home";
import { Settings } from "./components/Settings";
import { applyA11y } from "./utils/applyA11y";
import { DEFAULT_PROFILE, type ProfileData, type Sighting } from "./types";

type Stage = "auth" | "onboarding" | "app";
type Screen = "home" | "settings";

function loadProfile(): ProfileData | null {
  try {
    const raw = localStorage.getItem("ephemeris-profile");
    return raw ? (JSON.parse(raw) as ProfileData) : null;
  } catch {
    return null;
  }
}

function loadSightings(): Sighting[] {
  try {
    const raw = localStorage.getItem("ephemeris-sightings");
    return raw ? (JSON.parse(raw) as Sighting[]) : [];
  } catch {
    return [];
  }
}

function cleanVersion(version: string): string {
  return version.replaceAll("_", ".");
}

function getOsLabel(ua: string, touchMac: boolean): string {
  const iosVersion = ua.match(/(?:iphone|ipad).*os ([\d_]+)/)?.[1];
  const androidVersion = ua.match(/android ([\d.]+)/)?.[1];
  const windowsVersion = ua.match(/windows nt ([\d.]+)/)?.[1];

  if (touchMac) return "iPadOS";
  if (iosVersion) return `iOS ${cleanVersion(iosVersion)}`;
  if (androidVersion) return `Android ${androidVersion}`;
  if (ua.includes("mac os x")) return "macOS";
  if (windowsVersion === "10.0") return "Windows 10/11";
  if (windowsVersion === "6.3") return "Windows 8.1";
  if (windowsVersion === "6.2") return "Windows 8";
  if (windowsVersion === "6.1") return "Windows 7";
  if (windowsVersion) return `Windows ${windowsVersion}`;
  if (ua.includes("linux")) return "Linux";
  return "";
}

function getLocalJournalLabel() {
  const platform = navigator.platform.toLowerCase();
  const ua = navigator.userAgent.toLowerCase();
  const touchMac = platform.includes("mac") && navigator.maxTouchPoints > 1;
  const osLabel = getOsLabel(ua, touchMac);
  return (
    <>
      Field journal | this device{osLabel ? <> <em>({osLabel})</em></> : null}
    </>
  );
}

function App() {
  const [stage, setStage] = useState<Stage>("auth");
  const [screen, setScreen] = useState<Screen>("home");
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [sightings, setSightings] = useState<Sighting[]>([]);

  useEffect(() => {
    const existing = loadProfile();
    if (existing) {
      setProfile(existing);
      setSightings(loadSightings());
      applyA11y(existing.a11y);
      setStage("app");
    }
  }, []);

  const handleAuth = (state: AuthState) => {
    setAuth(state);
    const existing = loadProfile();
    if (existing) {
      setProfile(existing);
      setSightings(loadSightings());
      applyA11y(existing.a11y);
      setStage("app");
    } else {
      setStage("onboarding");
    }
  };

  const saveProfile = (p: ProfileData) => {
    setProfile(p);
    localStorage.setItem("ephemeris-profile", JSON.stringify(p));
    applyA11y(p.a11y);
  };

  const handleOnboardingComplete = (p: ProfileData) => {
    saveProfile(p);
    setStage("app");
  };

  const handleLog = (s: Sighting) => {
    setSightings((prev) => {
      const next = [...prev, s];
      localStorage.setItem("ephemeris-sightings", JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateSighting = (id: string, patch: Pick<Sighting, "context" | "note">) => {
    setSightings((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      localStorage.setItem("ephemeris-sightings", JSON.stringify(next));
      return next;
    });
  };

  const handleSignOut = () => {
    setAuth(null);
    setScreen("home");
    setStage("auth");
  };

  const handleClearData = () => {
    localStorage.removeItem("ephemeris-profile");
    localStorage.removeItem("ephemeris-sightings");
    setProfile(DEFAULT_PROFILE);
    setSightings([]);
    setAuth(null);
    setScreen("home");
    setStage("auth");
  };

  if (stage === "auth") {
    return <AuthPage onAuth={handleAuth} />;
  }

  if (stage === "onboarding") {
    return <Onboarding isGuest={auth?.isGuest} onComplete={handleOnboardingComplete} onRegister={(email) => setAuth({ email, isGuest: false })} />;
  }

  if (screen === "settings") {
    return (
      <Settings profile={profile} onChange={saveProfile} onBack={() => setScreen("home")} onSignOut={handleSignOut} onClearData={handleClearData} />
    );
  }

  return (
    <Home
      profile={profile}
      sightings={sightings}
      onLog={handleLog}
      onUpdateSighting={handleUpdateSighting}
      onOpenSettings={() => setScreen("settings")}
      accountLabel={auth?.isGuest || !auth?.email ? getLocalJournalLabel() : auth.email}
    />
  );
}

export default App;
