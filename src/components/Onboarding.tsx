import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { hashPassword } from "../utils/crypto";
import { applyA11y } from "../utils/applyA11y";
import { AccessibilityStep } from "./AccessibilityStep";
import {
  AVATARS,
  DEFAULT_A11Y,
  DEFAULT_PROFILE,
  DRAGON_SPECIES,
  PRONOUN_OPTIONS,
  SENSORY_OPTIONS,
  SUPPORT_OPTIONS,
  type A11ySettings,
  type ProfileData,
} from "../types";

const TOTAL_STEPS = 6;

interface Props {
  onComplete: (profile: ProfileData) => void;
  isGuest?: boolean;
  onRegister?: (email: string) => void;
}

export function Onboarding({ onComplete, isGuest, onRegister }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [pronoun, setPronoun] = useState("");
  const [avatar, setAvatar] = useState("🐉");
  const [avatarPhoto, setAvatarPhoto] = useState("");
  const [sensory, setSensory] = useState<string[]>([]);
  const [support, setSupport] = useState<string[]>([]);
  const [dragonRoster, setDragonRoster] = useState<string[]>([]);
  const [a11y, setA11y] = useState<A11ySettings>(DEFAULT_A11Y);

  const [signUpOpen, setSignUpOpen] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpError, setSignUpError] = useState("");

  const updateA11y = (s: A11ySettings) => {
    setA11y(s);
    applyA11y(s);
  };

  const toggleFrom = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const uploadAvatarPhoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPhoto(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  const registerAndFinish = async () => {
    setSignUpError("");
    if (!signUpEmail.trim()) {
      setSignUpError("Please enter your email.");
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError("Password must be at least 6 characters.");
      return;
    }
    const accounts: Record<string, { passwordHash: string }> = (() => {
      try {
        return JSON.parse(localStorage.getItem("ephemeris-accounts") ?? "{}");
      } catch {
        return {};
      }
    })();
    if (accounts[signUpEmail.toLowerCase()]) {
      setSignUpError("That email is already in use.");
      return;
    }
    accounts[signUpEmail.toLowerCase()] = { passwordHash: await hashPassword(signUpPassword) };
    localStorage.setItem("ephemeris-accounts", JSON.stringify(accounts));
    onRegister?.(signUpEmail.toLowerCase());
    finish();
  };

  const finish = () => {
    const profile: ProfileData = {
      ...DEFAULT_PROFILE,
      name: name.trim() || DEFAULT_PROFILE.name,
      pronoun,
      avatar,
      avatarPhoto,
      sensory,
      support,
      dragonRoster,
      a11y,
    };
    onComplete(profile);
  };

  return (
    <div className="app-shell flex flex-col">
      {/* Step 0: Welcome */}
      {step === 0 && (
        <div
          className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6 animate__animated animate__fadeIn"
          style={{ position: "relative" }}
        >
          <div
            className="rounded-3xl flex items-center justify-center card-surface"
            style={{ width: 96, height: 96, backgroundColor: "var(--ember-bg)", border: "2px solid var(--border)", padding: 16 }}
          >
            <img src="/favicon.webp" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div>
            <h1 className="font-heading" style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 12, color: "var(--foreground)" }}>
              Welcome, field researcher
            </h1>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.7, maxWidth: 320, margin: "0 auto", color: "var(--muted-foreground)" }}>
              Let's set up your bestiary and make this feel like yours. Takes about two minutes.
            </p>
          </div>
          <button
            onClick={() => setStep(1)}
            className="w-full max-w-xs rounded-2xl py-4 btn-primary"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 700, fontSize: "1.05rem" }}
          >
            Get started
          </button>
        </div>
      )}

      {/* Steps 1-6 */}
      {step >= 1 && (
        <>
          <div className="px-6 pt-6 pb-2 flex items-center gap-3 max-w-lg mx-auto w-full" style={{ position: "relative" }}>
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              aria-label="Go back"
              className="p-3 rounded-full icon-hover"
              style={{ color: "var(--muted-foreground)", transition: "background-color 0.15s, color 0.15s" }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full"
                  style={{ height: 4, backgroundColor: i < step ? "var(--primary)" : "var(--surface-2)", transition: "background-color 0.3s" }}
                />
              ))}
            </div>
            <span style={{ fontSize: "0.8rem", minWidth: 40, textAlign: "right", color: "var(--muted-foreground)" }}>
              {step}/{TOTAL_STEPS}
            </span>
          </div>

          <div className="flex-1 flex flex-col px-6 py-4 max-w-lg mx-auto w-full" style={{ position: "relative" }}>
            {/* Step 1: Name */}
            {step === 1 && (
              <div className="flex flex-col gap-5 flex-1 animate__animated animate__fadeIn animate__faster">
                <div>
                  <h2 className="font-heading" style={{ fontWeight: 800, marginBottom: 8, color: "var(--foreground)" }}>
                    What should we call you?
                  </h2>
                  <p style={{ fontSize: "0.95rem", color: "var(--muted-foreground)" }}>Only you will see this.</p>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  className="w-full rounded-2xl px-5 py-4 border outline-none"
                  style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", fontSize: "1.1rem" }}
                />
                <select
                  value={pronoun}
                  onChange={(e) => setPronoun(e.target.value)}
                  aria-label="Pronouns (optional)"
                  className="w-full rounded-2xl px-5 py-4 border outline-none select-field"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    color: pronoun ? "var(--foreground)" : "var(--muted-foreground)",
                    fontSize: "1rem",
                  }}
                >
                  <option value="">Pronouns (optional)</option>
                  {PRONOUN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 2: Avatar */}
            {step === 2 && (
              <div className="flex flex-col gap-5 flex-1 animate__animated animate__fadeIn animate__faster">
                <div>
                  <h2 className="font-heading" style={{ fontWeight: 800, marginBottom: 8, color: "var(--foreground)" }}>
                    Pick a profile image
                  </h2>
                  <p style={{ fontSize: "0.95rem", color: "var(--muted-foreground)" }}>
                    Choose an icon or add your own photo – you can change it later.
                  </p>
                </div>
                <div
                  className="rounded-2xl p-4 flex items-center justify-center border card-surface"
                  style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", fontSize: "4rem", height: 120 }}
                >
                  {avatarPhoto ? (
                    <img src={avatarPhoto} alt="" className="rounded-2xl" style={{ width: 88, height: 88, objectFit: "cover" }} />
                  ) : (
                    avatar
                  )}
                </div>
                <div className="flex gap-2">
                  <label
                    className="flex-1 rounded-xl py-3 border-2 option-card text-center"
                    style={{ backgroundColor: "var(--surface-1)", borderColor: "transparent", color: "var(--foreground)", fontWeight: 700, fontSize: "0.9rem" }}
                  >
                    Add photo
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => uploadAvatarPhoto(e.target.files?.[0])} />
                  </label>
                  {avatarPhoto && (
                    <button
                      onClick={() => setAvatarPhoto("")}
                      className="rounded-xl px-4 py-3 border-2 option-card"
                      style={{ backgroundColor: "var(--surface-1)", borderColor: "transparent", color: "var(--foreground)", fontWeight: 700, fontSize: "0.9rem" }}
                    >
                      Use icon
                    </button>
                  )}
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
                  {AVATARS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setAvatar(e)}
                      className="rounded-2xl flex items-center justify-center hover:scale-110 option-card"
                      style={{
                        aspectRatio: "1",
                        fontSize: "1.8rem",
                        backgroundColor: avatar === e ? "var(--ember-bg)" : "var(--surface-1)",
                        border: avatar === e ? "2px solid var(--primary)" : "2px solid transparent",
                        transition: "all 0.15s",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Sensory + support */}
            {step === 3 && (
              <div className="flex flex-col gap-6 flex-1 animate__animated animate__fadeIn animate__faster">
                <div>
                  <h2 className="font-heading" style={{ fontWeight: 800, marginBottom: 8, color: "var(--foreground)" }}>
                    Anything we should know?
                  </h2>
                  <p style={{ fontSize: "0.95rem", color: "var(--muted-foreground)" }}>
                    Pick as many as apply, or skip – this just helps tailor things later.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {SENSORY_OPTIONS.map((opt) => {
                    const active = sensory.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        onClick={() => toggleFrom(sensory, setSensory, opt.key)}
                        className="flex items-center gap-4 rounded-2xl px-5 py-4 border-2 text-left option-card card-surface"
                        style={{
                          backgroundColor: active ? "var(--ember-bg)" : "var(--card)",
                          borderColor: active ? "var(--primary)" : "var(--border)",
                          transition: "all 0.15s",
                        }}
                        aria-pressed={active}
                      >
                        <span style={{ fontSize: "1.5rem", width: 32 }}>{opt.emoji}</span>
                        <span className="flex-1" style={{ fontWeight: active ? 700 : 500, color: "var(--foreground)" }}>
                          {opt.label}
                        </span>
                        {active && (
                          <div
                            className="rounded-full flex items-center justify-center"
                            style={{ width: 24, height: 24, backgroundColor: "var(--primary)", flexShrink: 0 }}
                          >
                            <Check size={14} color="white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Support preferences */}
            {step === 4 && (
              <div className="flex flex-col gap-5 flex-1 animate__animated animate__fadeIn animate__faster">
                <div>
                  <h2 className="font-heading" style={{ fontWeight: 800, marginBottom: 8, color: "var(--foreground)" }}>
                    What helps you most?
                  </h2>
                  <p style={{ fontSize: "0.95rem", color: "var(--muted-foreground)" }}>We'll lean on these when suggesting things.</p>
                </div>
                <div className="flex flex-col gap-2">
                  {SUPPORT_OPTIONS.map((opt) => {
                    const active = support.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        onClick={() => toggleFrom(support, setSupport, opt.key)}
                        className="flex items-center gap-4 rounded-2xl px-5 py-4 border-2 text-left option-card card-surface"
                        style={{
                          backgroundColor: active ? "var(--glass-bg)" : "var(--card)",
                          borderColor: active ? "var(--glass-vivid)" : "var(--border)",
                          transition: "all 0.15s",
                        }}
                        aria-pressed={active}
                      >
                        <span style={{ fontSize: "1.5rem", width: 32 }}>{opt.emoji}</span>
                        <span className="flex-1" style={{ fontWeight: active ? 700 : 500, color: "var(--foreground)" }}>
                          {opt.label}
                        </span>
                        {active && (
                          <div
                            className="rounded-full flex items-center justify-center"
                            style={{ width: 24, height: 24, backgroundColor: "var(--glass-vivid)", flexShrink: 0 }}
                          >
                            <Check size={14} color="white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Build your dragon roster */}
            {step === 5 && (
              <div className="flex flex-col gap-5 flex-1 animate__animated animate__fadeIn animate__faster">
                <div>
                  <h2 className="font-heading" style={{ fontWeight: 800, marginBottom: 8, color: "var(--foreground)" }}>
                    Build your roster
                  </h2>
                  <p style={{ fontSize: "0.95rem", color: "var(--muted-foreground)" }}>
                    Pick the dragons you'd like to see more often in your mood check-ins – you can always change them later.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {DRAGON_SPECIES.map((d) => {
                    const active = dragonRoster.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        onClick={() => toggleFrom(dragonRoster, setDragonRoster, d.key)}
                        className="flex items-center gap-4 rounded-2xl px-5 py-4 border-2 text-left option-card card-surface"
                        style={{
                          backgroundColor: active ? "var(--ember-bg)" : "var(--card)",
                          borderColor: active ? "var(--primary)" : "var(--border)",
                          transition: "all 0.15s",
                        }}
                        aria-pressed={active}
                      >
                        <div
                          className="rounded-xl flex items-center justify-center shrink-0"
                          style={{ width: 64, height: 64, backgroundColor: "var(--surface-1)", overflow: "hidden" }}
                        >
                          <img src={d.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-heading" style={{ fontWeight: active ? 700 : 600, color: "var(--foreground)" }}>
                            {d.name}
                          </p>
                          <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)" }}>{d.represents}</p>
                        </div>
                        {active && (
                          <div
                            className="rounded-full flex items-center justify-center"
                            style={{ width: 24, height: 24, backgroundColor: "var(--primary)", flexShrink: 0 }}
                          >
                            <Check size={14} color="white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 6: Accessibility */}
            {step === 6 && (
              <div className="flex flex-col gap-5 flex-1 animate__animated animate__fadeIn animate__faster">
                <div>
                  <h2 className="font-heading" style={{ fontWeight: 800, marginBottom: 8, color: "var(--foreground)" }}>
                    Make it comfortable
                  </h2>
                  <p style={{ fontSize: "0.95rem", color: "var(--muted-foreground)" }}>Adjust anything that helps – all optional.</p>
                </div>
                <AccessibilityStep settings={a11y} onChange={updateA11y} />
                <p
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: "var(--glass-bg)", color: "var(--glass-text)", fontSize: "0.85rem", lineHeight: 1.6 }}
                >
                  Every setting here applies instantly and can be changed again later — nothing is locked in.
                </p>
              </div>
            )}

            {/* Bottom buttons */}
            <div className="pt-6 pb-4 flex flex-col gap-3">
              {step === TOTAL_STEPS ? (
                <>
                  {isGuest && onRegister && (
                    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                      <button
                        onClick={() => {
                          setSignUpOpen((o) => !o);
                          setSignUpError("");
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 text-left row-hover"
                      >
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--foreground)" }}>Save your setup</p>
                          <p style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>Create a free account to keep your data</p>
                        </div>
                        <span style={{ fontSize: "1.2rem", lineHeight: 1, color: "var(--muted-foreground)" }}>{signUpOpen ? "−" : "+"}</span>
                      </button>
                      {signUpOpen && (
                        <div className="px-4 pb-4 space-y-2.5 border-t" style={{ borderColor: "var(--border)", paddingTop: 12 }}>
                          <input
                            type="email"
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-xl px-4 py-2.5 border outline-none"
                            style={{
                              backgroundColor: "var(--input-background)",
                              borderColor: "var(--border)",
                              color: "var(--foreground)",
                              fontSize: "0.9rem",
                            }}
                            autoComplete="email"
                          />
                          <input
                            type="password"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && registerAndFinish()}
                            placeholder="Password (6+ characters)"
                            className="w-full rounded-xl px-4 py-2.5 border outline-none"
                            style={{
                              backgroundColor: "var(--input-background)",
                              borderColor: "var(--border)",
                              color: "var(--foreground)",
                              fontSize: "0.9rem",
                            }}
                            autoComplete="new-password"
                          />
                          {signUpError && <p style={{ color: "var(--destructive)", fontSize: "0.82rem", fontWeight: 600 }}>{signUpError}</p>}
                          <button
                            onClick={registerAndFinish}
                            className="w-full rounded-xl py-3 btn-primary"
                            style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 700, fontSize: "0.95rem" }}
                          >
                            Create account &amp; enter
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={finish}
                    className="w-full rounded-2xl py-4 btn-primary"
                    style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 700, fontSize: "1.05rem" }}
                  >
                    Enter your journal
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 btn-primary"
                  style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 700, fontSize: "1.05rem" }}
                >
                  Next
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
