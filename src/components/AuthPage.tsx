import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { useInView } from "../hooks/useInView";
import { revealClass, revealStyle } from "../utils/reveal";

export interface AuthState {
  email: string;
  isGuest: boolean;
}

interface Props {
  onAuth: (state: AuthState) => void;
}

export function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const authPanel = useInView<HTMLDivElement>();

  const switchMode = (m: "signup" | "login") => {
    setMode(m);
    setError("");
    setInfo("");
  };

  const submit = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Enter your email to continue.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (confirmPassword !== password) {
          setError("Passwords don't match.");
          return;
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (data.session) {
          onAuth({ email: email.trim().toLowerCase(), isGuest: false });
        } else {
          setInfo("Check your inbox to confirm your email, then log in below.");
          setMode("login");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) {
          setError(signInError.message === "Invalid login credentials" ? "Incorrect email or password." : signInError.message);
          return;
        }
        onAuth({ email: email.trim().toLowerCase(), isGuest: false });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell flex flex-col items-center justify-center px-5 py-12">
      <div
        ref={authPanel.ref}
        className={`w-full flex flex-col items-center ${revealClass(authPanel.inView, "fadeIn")}`}
        style={{ position: "relative", ...revealStyle() }}
      >
        <div className="mb-8" role="img" aria-label="Ephemeris">
          <img className="brand-wordmark brand-wordmark-light" src="/images/ephemeris_logo.webp" alt="" aria-hidden="true" />
          <img className="brand-wordmark brand-wordmark-dark" src="/images/ephemeris_logo-white.webp" alt="" aria-hidden="true" />
        </div>

        <div
          className="w-full max-w-sm rounded-3xl border overflow-hidden card-surface"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", position: "relative" }}
        >
          <div className="accent-bar" />
          <div className="p-7 space-y-5">
            <div className="flex rounded-2xl overflow-hidden border" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
              {(["signup", "login"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2.5 ${mode === m ? "" : "tab-hover"}`}
                  aria-pressed={mode === m}
                  style={{
                    fontWeight: mode === m ? 700 : 500,
                    backgroundColor: mode === m ? "var(--tab-active)" : "transparent",
                    color: mode === m ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    fontSize: "0.92rem",
                    transition: "all 0.15s",
                  }}
                >
                  {m === "signup" ? "Sign up" : "Log in"}
                </button>
              ))}
            </div>

            <form key={mode} onSubmit={(e) => e.preventDefault()} autoComplete="on" className="space-y-5">
              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: 6, color: "var(--foreground)" }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="you@example.com"
                  aria-label="Email"
                  autoComplete="email"
                  className="w-full rounded-xl px-4 py-3 border outline-none focus:border-(--primary)"
                  style={{ backgroundColor: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>

            <div>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: 6, color: "var(--foreground)" }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="6+ characters"
                  aria-label="Password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full rounded-xl px-4 py-3 border outline-none focus:border-(--primary)"
                  style={{
                    backgroundColor: "var(--input-background)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    paddingRight: "2.75rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full icon-hover"
                  style={{ color: "var(--muted-foreground)" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: 6, color: "var(--foreground)" }}>
                  Confirm password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="new-password-confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Re-enter password"
                  aria-label="Confirm password"
                  autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 border outline-none focus:border-(--primary)"
                  style={{ backgroundColor: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
            )}
          </form>

          {error && (
            <p
              role="alert"
              className="rounded-xl px-4 py-2.5"
              style={{ backgroundColor: "rgba(192,57,43,0.1)", color: "var(--destructive)", fontSize: "0.88rem", fontWeight: 600 }}
            >
              {error}
            </p>
          )}

          {info && (
            <p
              role="status"
              className="rounded-xl px-4 py-2.5"
              style={{ backgroundColor: "var(--glass-bg)", color: "var(--glass-text)", fontSize: "0.88rem", fontWeight: 600 }}
            >
              {info}
            </p>
          )}

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full rounded-2xl py-3.5 btn-primary"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              fontWeight: 700,
              fontSize: "1rem",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </button>

            <button
              onClick={() => onAuth({ email: "", isGuest: true })}
              className="w-full text-center link-hover"
              style={{ fontSize: "0.88rem", color: "var(--muted-foreground)" }}
            >
              Continue as guest
            </button>
          </div>
        </div>

        <p className="mt-6 text-center" style={{ fontSize: "0.76rem", maxWidth: 300, lineHeight: 1.6, color: "var(--muted-foreground)" }}>
          Signing up syncs your journal to your account. Guest mode keeps everything on this device only.
        </p>
      </div>
    </div>
  );
}
