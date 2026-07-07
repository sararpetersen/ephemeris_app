import { useEffect, useState } from "react";
import { AuthPage, type AuthState } from "./components/AuthPage";
import { Onboarding } from "./components/Onboarding";
import { Home } from "./components/Home";
import { Settings } from "./components/Settings";
import { applyA11y } from "./utils/applyA11y";
import { getAccounts } from "./utils/accounts";
import { DEFAULT_PROFILE, type ProfileData, type Sighting } from "./types";

type Stage = "auth" | "onboarding" | "app";
type Screen = "home" | "settings";

function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem("ephemeris-auth");
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {
    // fall through to recovery below
  }
  // Legacy sessions (created before auth identity was persisted) have no
  // "ephemeris-auth" entry. This app only ever stores accounts on this one
  // device, so if there's exactly one registered account, it must be this
  // profile's owner.
  const accounts = getAccounts();
  const keys = Object.keys(accounts);
  if (keys.length === 1) {
    const recovered: AuthState = { email: keys[0], isGuest: false };
    saveAuth(recovered);
    return recovered;
  }
  return null;
}

function saveAuth(state: AuthState | null) {
  if (state) {
    localStorage.setItem("ephemeris-auth", JSON.stringify(state));
  } else {
    localStorage.removeItem("ephemeris-auth");
  }
}

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

  const updateAuth = (state: AuthState | null) => {
    saveAuth(state);
    setAuth(state);
  };

  useEffect(() => {
    if (localStorage.getItem("ephemeris-signed-out") === "1") return;
    const existing = loadProfile();
    if (existing) {
      setAuth(loadAuth());
      setProfile(existing);
      setSightings(loadSightings());
      applyA11y(existing.a11y);
      setStage("app");
    }
  }, []);

  const handleAuth = (state: AuthState) => {
    localStorage.removeItem("ephemeris-signed-out");
    updateAuth(state);
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
    localStorage.setItem("ephemeris-signed-out", "1");
    updateAuth(null);
    setScreen("home");
    setStage("auth");
  };

  const handleImportData = (p: ProfileData, s: Sighting[]) => {
    saveProfile(p);
    setSightings(s);
    localStorage.setItem("ephemeris-sightings", JSON.stringify(s));
  };

  const handleClearData = () => {
    localStorage.removeItem("ephemeris-profile");
    localStorage.removeItem("ephemeris-sightings");
    localStorage.removeItem("ephemeris-onboarding-draft");
    localStorage.removeItem("ephemeris-signed-out");
    setProfile(DEFAULT_PROFILE);
    setSightings([]);
    updateAuth(null);
    setScreen("home");
    setStage("auth");
  };

  if (stage === "auth") {
    return <AuthPage onAuth={handleAuth} />;
  }

  if (stage === "onboarding") {
    return <Onboarding isGuest={auth?.isGuest} onComplete={handleOnboardingComplete} onRegister={(email) => updateAuth({ email, isGuest: false })} />;
  }

  if (screen === "settings") {
    return (
      <Settings
        profile={profile}
        sightings={sightings}
        onChange={saveProfile}
        onBack={() => setScreen("home")}
        onSignOut={handleSignOut}
        onClearData={handleClearData}
        isGuest={auth?.isGuest || !auth?.email}
        auth={auth ?? { email: "", isGuest: true }}
        onSetAuth={updateAuth}
        onImportData={handleImportData}
      />
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
