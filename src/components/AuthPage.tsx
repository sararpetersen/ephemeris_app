import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { hashPassword } from "../utils/crypto";

export interface AuthState {
  email: string;
  isGuest: boolean;
}

interface StoredAccount {
  passwordHash: string;
}

function getAccounts(): Record<string, StoredAccount> {
  try { return JSON.parse(localStorage.getItem("ephemeris-accounts") ?? "{}"); } catch { return {}; }
}

function saveAccounts(accounts: Record<string, StoredAccount>) {
  localStorage.setItem("ephemeris-accounts", JSON.stringify(accounts));
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

  const switchMode = (m: "signup" | "login") => {
    setMode(m);
    setError("");
  };

  const submit = async () => {
    setError("");
    if (!email.trim()) { setError("Enter your email to continue."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    const accounts = getAccounts();
    const passwordHash = await hashPassword(password);

    if (mode === "signup") {
      if (confirmPassword !== password) { setError("Passwords don't match."); return; }
      if (accounts[email.toLowerCase()]) { setError("An account with that email already exists."); return; }
      accounts[email.toLowerCase()] = { passwordHash };
      saveAccounts(accounts);
      onAuth({ email: email.toLowerCase(), isGuest: false });
    } else {
      const stored = accounts[email.toLowerCase()];
      if (!stored || stored.passwordHash !== passwordHash) { setError("Incorrect email or password."); return; }
      onAuth({ email: email.toLowerCase(), isGuest: false });
    }
  };

  return (
    <div className="app-shell flex flex-col items-center justify-center px-5 py-12">
      <div className="mb-8 animate__animated animate__fadeInDown animate__faster" style={{ position: "relative" }} role="img" aria-label="Ephemeris">
        <img className="brand-wordmark brand-wordmark-light" src="/images/ephemeris_logo.webp" alt="" aria-hidden="true" />
        <img className="brand-wordmark brand-wordmark-dark" src="/images/ephemeris_logo-white.webp" alt="" aria-hidden="true" />
      </div>

      <div
        className="w-full max-w-sm rounded-3xl border overflow-hidden card-surface animate__animated animate__fadeInUp animate__faster"
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

        <div>
          <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: 6, color: "var(--foreground)" }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="you@example.com"
            aria-label="Email"
            autoComplete="email"
            className="w-full rounded-xl px-4 py-3 border outline-none focus:border-[var(--primary)]"
            style={{ backgroundColor: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: 6, color: "var(--foreground)" }}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="6+ characters"
              aria-label="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full rounded-xl px-4 py-3 border outline-none focus:border-[var(--primary)]"
              style={{ backgroundColor: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)", paddingRight: "2.75rem" }}
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Re-enter password"
              aria-label="Confirm password"
              autoComplete="new-password"
              className="w-full rounded-xl px-4 py-3 border outline-none focus:border-[var(--primary)]"
              style={{ backgroundColor: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl px-4 py-2.5" style={{ backgroundColor: "rgba(192,57,43,0.1)", color: "var(--destructive)", fontSize: "0.88rem", fontWeight: 600 }}>
            {error}
          </p>
        )}

        <button
          onClick={submit}
          className="w-full rounded-2xl py-3.5 btn-primary"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 700, fontSize: "1rem" }}
        >
          {mode === "signup" ? "Create account" : "Log in"}
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

      <p
        className="mt-6 text-center animate__animated animate__fadeIn"
        style={{ position: "relative", fontSize: "0.76rem", maxWidth: 300, lineHeight: 1.6, color: "var(--muted-foreground)" }}
      >
        Your account data stays on this device for now — no server, no tracking.
      </p>
    </div>
  );
}
