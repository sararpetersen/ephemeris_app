import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthPage, type AuthState } from "./components/AuthPage";
import { Onboarding } from "./components/Onboarding";
import { Home } from "./components/Home";
import { Settings } from "./components/Settings";
import { applyA11y } from "./utils/applyA11y";
import { supabase } from "./utils/supabaseClient";
import {
  fetchProfile,
  fetchSightings,
  saveProfileRemote,
  insertSightingRemote,
  updateSightingRemote,
  replaceAllSightingsRemote,
  deleteAllRemoteData,
} from "./utils/supabaseData";
import { DEFAULT_PROFILE, type ProfileData, type Sighting } from "./types";

type Stage = "loading" | "auth" | "onboarding" | "app";
type Screen = "home" | "settings";

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function loadGuestProfile(): ProfileData | null {
  try {
    const raw = localStorage.getItem("ephemeris-profile");
    return raw ? (JSON.parse(raw) as ProfileData) : null;
  } catch {
    return null;
  }
}

function loadGuestSightings(): Sighting[] {
  try {
    const raw = localStorage.getItem("ephemeris-sightings");
    return raw ? (JSON.parse(raw) as Sighting[]) : [];
  } catch {
    return [];
  }
}

function saveGuestProfile(p: ProfileData) {
  localStorage.setItem("ephemeris-profile", JSON.stringify(p));
}

function saveGuestSightings(s: Sighting[]) {
  localStorage.setItem("ephemeris-sightings", JSON.stringify(s));
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
  const [stage, setStage] = useState<Stage>("loading");
  const [screen, setScreen] = useState<Screen>("home");
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [sightings, setSightings] = useState<Sighting[]>([]);

  const auth: AuthState = { email: session?.user.email ?? "", isGuest: isGuest || !session };

  const loadRemote = async (uid: string) => {
    localStorage.removeItem("ephemeris-signed-out");
    setIsGuest(false);
    const [remoteProfile, remoteSightings] = await Promise.all([fetchProfile(uid), fetchSightings(uid)]);
    if (remoteProfile) {
      setProfile(remoteProfile);
      setSightings(remoteSightings);
      applyA11y(remoteProfile.a11y);
      setStage("app");
    } else {
      setStage("onboarding");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setSession(data.session);
        await loadRemote(data.session.user.id);
        return;
      }
      if (localStorage.getItem("ephemeris-signed-out") !== "1") {
        const existing = loadGuestProfile();
        if (existing) {
          setIsGuest(true);
          setProfile(existing);
          setSightings(loadGuestSightings());
          applyA11y(existing.a11y);
          setStage("app");
          return;
        }
      }
      setStage("auth");
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = async (state: AuthState) => {
    if (state.isGuest) {
      localStorage.removeItem("ephemeris-signed-out");
      setIsGuest(true);
      const existing = loadGuestProfile();
      if (existing) {
        setProfile(existing);
        setSightings(loadGuestSightings());
        applyA11y(existing.a11y);
        setStage("app");
      } else {
        setStage("onboarding");
      }
      return;
    }
    const uid = await getCurrentUserId();
    if (uid) {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await loadRemote(uid);
    }
  };

  const saveProfile = async (p: ProfileData) => {
    setProfile(p);
    applyA11y(p.a11y);
    const uid = await getCurrentUserId();
    if (uid) {
      await saveProfileRemote(uid, p);
    } else {
      saveGuestProfile(p);
    }
  };

  const handleOnboardingComplete = (p: ProfileData) => {
    saveProfile(p);
    setStage("app");
  };

  const handleLog = async (s: Sighting) => {
    const uid = await getCurrentUserId();
    setSightings((prev) => {
      const next = [...prev, s];
      if (!uid) saveGuestSightings(next);
      return next;
    });
    if (uid) await insertSightingRemote(uid, s);
  };

  const handleUpdateSighting = async (id: string, patch: Pick<Sighting, "context" | "note">) => {
    const uid = await getCurrentUserId();
    setSightings((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      if (!uid) saveGuestSightings(next);
      return next;
    });
    if (uid) await updateSightingRemote(uid, id, patch);
  };

  const handleSignOut = async () => {
    const uid = await getCurrentUserId();
    if (uid) {
      await supabase.auth.signOut();
      setSession(null);
    } else {
      localStorage.setItem("ephemeris-signed-out", "1");
      setIsGuest(false);
    }
    setScreen("home");
    setStage("auth");
  };

  const handleImportData = async (p: ProfileData, s: Sighting[]) => {
    setProfile(p);
    setSightings(s);
    applyA11y(p.a11y);
    const uid = await getCurrentUserId();
    if (uid) {
      await saveProfileRemote(uid, p);
      await replaceAllSightingsRemote(uid, s);
    } else {
      saveGuestProfile(p);
      saveGuestSightings(s);
    }
  };

  const handleClearData = async () => {
    const uid = await getCurrentUserId();
    if (uid) {
      await deleteAllRemoteData(uid);
      await supabase.auth.signOut();
      setSession(null);
    } else {
      localStorage.removeItem("ephemeris-profile");
      localStorage.removeItem("ephemeris-sightings");
      localStorage.removeItem("ephemeris-onboarding-draft");
      localStorage.removeItem("ephemeris-signed-out");
      setIsGuest(false);
    }
    setProfile(DEFAULT_PROFILE);
    setSightings([]);
    setScreen("home");
    setStage("auth");
  };

  if (stage === "loading") {
    return <div className="app-shell" />;
  }

  if (stage === "auth") {
    return <AuthPage onAuth={handleAuth} />;
  }

  if (stage === "onboarding") {
    return (
      <Onboarding
        isGuest={isGuest}
        onComplete={handleOnboardingComplete}
        onRegister={(newSession) => {
          localStorage.removeItem("ephemeris-signed-out");
          setSession(newSession);
          setIsGuest(false);
        }}
      />
    );
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
        isGuest={auth.isGuest}
        auth={auth}
        onSessionChange={(newSession) => {
          localStorage.removeItem("ephemeris-signed-out");
          setSession(newSession);
          setIsGuest(false);
        }}
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
      accountLabel={auth.isGuest || !auth.email ? getLocalJournalLabel() : auth.email}
    />
  );
}

export default App;
