import { useEffect, useState } from "react";
import { AuthPage, type AuthState } from "./components/AuthPage";
import { Onboarding } from "./components/Onboarding";
import { applyA11y } from "./utils/applyA11y";
import { DEFAULT_PROFILE, DRAGON_SPECIES, type ProfileData } from "./types";

type Stage = "auth" | "onboarding" | "app";

function loadProfile(): ProfileData | null {
  try {
    const raw = localStorage.getItem("ephemeris-profile");
    return raw ? (JSON.parse(raw) as ProfileData) : null;
  } catch {
    return null;
  }
}

function App() {
  const [stage, setStage] = useState<Stage>("auth");
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);

  useEffect(() => {
    const existing = loadProfile();
    if (existing) {
      setProfile(existing);
      applyA11y(existing.a11y);
      setStage("app");
    }
  }, []);

  const handleAuth = (state: AuthState) => {
    setAuth(state);
    setStage("onboarding");
  };

  const handleOnboardingComplete = (p: ProfileData) => {
    setProfile(p);
    localStorage.setItem("ephemeris-profile", JSON.stringify(p));
    applyA11y(p.a11y);
    setStage("app");
  };

  if (stage === "auth") {
    return <AuthPage onAuth={handleAuth} />;
  }

  if (stage === "onboarding") {
    return (
      <Onboarding
        isGuest={auth?.isGuest}
        onComplete={handleOnboardingComplete}
        onRegister={(email) => setAuth({ email, isGuest: false })}
      />
    );
  }

  const roster = DRAGON_SPECIES.filter((d) => profile.dragonRoster.includes(d.key));

  return (
    <div className="app-shell animate__animated animate__fadeIn">
      <div className="max-w-lg mx-auto px-6 py-10 space-y-6" style={{ position: "relative" }}>
        <div className="flex items-center gap-4">
          <div className="rounded-2xl flex items-center justify-center card-surface" style={{ width: 56, height: 56, backgroundColor: "var(--ember-bg)", fontSize: "2rem" }}>
            {profile.avatar}
          </div>
          <div>
            <h1 className="font-heading" style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--foreground)" }}>
              {profile.name ? `Welcome back, ${profile.name}` : "Welcome back"}
            </h1>
            <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}>
              {auth?.isGuest ? "Browsing as guest" : auth?.email}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden card-surface" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <div className="accent-bar" />
          <div className="p-5">
            <h2 className="font-heading" style={{ fontWeight: 700, marginBottom: 12, color: "var(--foreground)" }}>Your roster</h2>
            {roster.length === 0 ? (
              <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}>No dragons added yet.</p>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {roster.map((d) => (
                  <div key={d.key} className="rounded-xl p-3 border card-surface" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                    <div className="rounded-lg" style={{ width: 48, height: 48, marginBottom: 8, overflow: "hidden" }}>
                      <img src={d.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <p className="font-heading" style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--foreground)" }}>{d.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{d.represents}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
          This is a placeholder home screen — logging a sighting comes next.
        </p>
      </div>
    </div>
  );
}

export default App;
