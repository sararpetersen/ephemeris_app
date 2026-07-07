import { useState, type ReactNode } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { AccessibilityStep } from "./AccessibilityStep";
import { applyA11y } from "../utils/applyA11y";
import { AVATARS, DRAGON_SPECIES, PRONOUN_OPTIONS, type ProfileData } from "../types";

interface Props {
  profile: ProfileData;
  onChange: (p: ProfileData) => void;
  onBack: () => void;
  onSignOut: () => void;
  onClearData: () => void;
}

function Section({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={`settings-section ${className} rounded-2xl border overflow-hidden card-surface`}
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <div className="p-5 space-y-4">
        <h2 className="font-heading" style={{ fontWeight: 700, color: "var(--foreground)" }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

export function Settings({ profile, onChange, onBack, onSignOut, onClearData }: Props) {
  const [draft, setDraft] = useState<ProfileData>(profile);
  const [confirmClear, setConfirmClear] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  const update = (patch: Partial<ProfileData>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setJustSaved(false);
  };

  const toggleDragon = (key: string) =>
    update({
      dragonRoster: draft.dragonRoster.includes(key) ? draft.dragonRoster.filter((k) => k !== key) : [...draft.dragonRoster, key],
    });

  const uploadAvatarPhoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ avatarPhoto: typeof reader.result === "string" ? reader.result : "" });
    reader.readAsDataURL(file);
  };

  const save = () => {
    onChange(draft);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const back = () => {
    if (dirty) applyA11y(profile.a11y);
    onBack();
  };

  return (
    <div className="app-shell animate__animated animate__fadeIn">
      <div className="settings-page">
        {/* Sticky header */}
        <div className="settings-header sticky-bar flex items-center gap-2">
          <button onClick={back} aria-label="Back to home" className="p-3 rounded-full icon-hover" style={{ color: "var(--muted-foreground)" }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading" style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--foreground)" }}>
            Settings
          </h1>
        </div>

        <div className="settings-content">
          {/* Profile */}
          <Section title="Profile" className="settings-profile-section">
            <div>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: 6, color: "var(--foreground)" }}>Name</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Your name"
                aria-label="Name"
                className="w-full rounded-xl px-4 py-3 border outline-none"
                style={{ backgroundColor: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: 6, color: "var(--foreground)" }}>
                Pronouns <em style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>(optional)</em>
              </label>
              <select
                value={draft.pronoun}
                onChange={(e) => update({ pronoun: e.target.value })}
                aria-label="Pronouns"
                className="w-full rounded-xl px-4 py-3 border outline-none select-field"
                style={{
                  backgroundColor: "var(--input-background)",
                  borderColor: "var(--border)",
                  color: draft.pronoun ? "var(--foreground)" : "var(--muted-foreground)",
                }}
              >
                <option value="">Select pronouns</option>
                {PRONOUN_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 8, color: "var(--foreground)" }}>Profile image</p>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="rounded-2xl flex items-center justify-center"
                  style={{ width: 72, height: 72, backgroundColor: "var(--surface-1)", fontSize: "2.25rem", overflow: "hidden", flexShrink: 0 }}
                >
                  {draft.avatarPhoto ? (
                    <img src={draft.avatarPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    draft.avatar
                  )}
                </div>
                <div className="flex-1 flex gap-2 flex-wrap">
                  <label
                    className="rounded-xl px-4 py-2.5 border-2 option-card"
                    style={{
                      backgroundColor: "var(--surface-1)",
                      borderColor: "transparent",
                      color: "var(--foreground)",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                    }}
                  >
                    Add photo
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      aria-label="Add profile photo"
                      onChange={(e) => uploadAvatarPhoto(e.target.files?.[0])}
                    />
                  </label>
                  {draft.avatarPhoto && (
                    <button
                      onClick={() => update({ avatarPhoto: "" })}
                      className="rounded-xl px-4 py-2.5 border-2 option-card"
                      style={{
                        backgroundColor: "var(--surface-1)",
                        borderColor: "transparent",
                        color: "var(--foreground)",
                        fontWeight: 700,
                        fontSize: "0.88rem",
                      }}
                    >
                      Use icon
                    </button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: "0.82rem", marginBottom: 8, color: "var(--muted-foreground)" }}>Icon fallback</p>
              <div className="compact-avatar-grid">
                {AVATARS.map((e) => (
                  <button
                    key={e}
                    onClick={() => update({ avatar: e })}
                    className="avatar-option rounded-xl flex items-center justify-center option-card"
                    style={{
                      backgroundColor: draft.avatar === e ? "var(--ember-bg)" : "var(--surface-1)",
                      border: draft.avatar === e ? "2px solid var(--primary)" : "2px solid transparent",
                    }}
                    aria-pressed={draft.avatar === e}
                    aria-label={`Use ${e} as profile icon`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Roster */}
          <Section title="Your roster" className="settings-roster-section">
            <p style={{ fontSize: "0.88rem", marginTop: -8, color: "var(--muted-foreground)" }}>
              Choose the dragons you want to see more often in the mood checker.
            </p>
            <div className="settings-roster-grid">
              {DRAGON_SPECIES.map((d) => {
                const active = draft.dragonRoster.includes(d.key);
                return (
                  <button
                    key={d.key}
                    onClick={() => toggleDragon(d.key)}
                    className="settings-roster-card flex items-center gap-3 rounded-xl px-4 py-3 border-2 text-left option-card"
                    style={{
                      backgroundColor: active ? "var(--ember-bg)" : "var(--surface-1)",
                      borderColor: active ? "var(--primary)" : "transparent",
                    }}
                    aria-pressed={active}
                  >
                    <div className="rounded-lg shrink-0" style={{ width: 44, height: 44, overflow: "hidden" }}>
                      <img src={d.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-heading" style={{ fontWeight: active ? 700 : 600, fontSize: "0.9rem", color: "var(--foreground)" }}>
                        {d.name}
                      </p>
                      <p style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>{d.represents}</p>
                    </div>
                    {active && (
                      <div
                        className="rounded-full flex items-center justify-center shrink-0"
                        style={{ width: 22, height: 22, backgroundColor: "var(--primary)" }}
                      >
                        <Check size={13} color="white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Accessibility */}
          <Section title="Comfort & accessibility" className="settings-comfort-section">
            <AccessibilityStep
              settings={draft.a11y}
              onChange={(a11y) => {
                update({ a11y });
                applyA11y(a11y);
              }}
            />
            <p
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "var(--glass-bg)", color: "var(--glass-text)", fontSize: "0.85rem", lineHeight: 1.6 }}
            >
              These preview instantly so you can see how they feel – press 'Save' below to keep them.
            </p>
          </Section>

          {/* Account */}
          <Section title="Account & data" className="settings-account-section">
            <button
              onClick={onSignOut}
              className="w-full rounded-xl py-3 border-2 option-card"
              style={{
                backgroundColor: "var(--surface-1)",
                borderColor: "transparent",
                color: "var(--foreground)",
                fontWeight: 600,
                fontSize: "0.92rem",
              }}
            >
              Log out
            </button>
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="w-full rounded-xl py-3 link-hover"
                style={{ color: "var(--destructive)", fontWeight: 600, fontSize: "0.92rem" }}
              >
                Delete all my data…
              </button>
            ) : (
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "rgba(192,57,43,0.08)" }}>
                <p style={{ fontSize: "0.88rem", color: "var(--foreground)" }}>
                  This erases your profile and every sighting from this device. There's no undo.
                </p>
                <div className="settings-danger-actions">
                  <button
                    onClick={onClearData}
                    className="flex-1 rounded-xl py-2.5"
                    style={{ backgroundColor: "var(--destructive)", color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}
                  >
                    Yes, delete everything
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 rounded-xl py-2.5 border option-card"
                    style={{
                      backgroundColor: "var(--surface-1)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                    }}
                  >
                    Keep my data
                  </button>
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Sticky save bar */}
        <div className="settings-save-bar sticky-bar">
          {justSaved && !dirty ? (
            <p
              className="rounded-2xl py-3.5 flex items-center justify-center gap-2 animate__animated animate__fadeIn animate__faster"
              style={{ backgroundColor: "var(--glass-bg)", color: "var(--glass-text)", fontWeight: 700, fontSize: "0.95rem" }}
            >
              <Check size={17} /> Saved
            </p>
          ) : (
            <button
              onClick={save}
              disabled={!dirty}
              className="w-full rounded-2xl py-3.5 btn-primary"
              style={{
                backgroundColor: dirty ? "var(--primary)" : "var(--surface-2)",
                color: dirty ? "var(--primary-foreground)" : "var(--muted-strong)",
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              {dirty ? "Save changes" : "No changes to save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
