import type { A11ySettings } from "../types";

function ToggleRow({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between rounded-xl p-4 text-left border-2 option-card card-surface"
      style={{
        backgroundColor: value ? "var(--ember-bg)" : "var(--surface-1)",
        borderColor: value ? "var(--primary)" : "transparent",
        transition: "all 0.15s",
      }}
      aria-pressed={value}
    >
      <div className="flex-1 mr-4">
        <p style={{ fontWeight: 700, color: "var(--foreground)" }}>{label}</p>
        <p style={{ fontSize: "0.85rem", marginTop: 2, color: "var(--muted-foreground)" }}>{description}</p>
      </div>
      <div
        className="flex-shrink-0 rounded-full relative"
        style={{ width: 44, height: 24, backgroundColor: value ? "var(--primary)" : "var(--muted-foreground)" }}
      >
        <div
          className="absolute top-1 rounded-full bg-white"
          style={{ width: 16, height: 16, left: value ? 24 : 4, transition: "left 0.2s" }}
        />
      </div>
    </button>
  );
}

function OptionGroup<V extends string>({ label, options, value, onChange }: {
  label: string;
  options: { value: V; label: string; hint?: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <div>
      <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 8, color: "var(--foreground)" }}>{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="rounded-xl px-4 py-2.5 border-2 text-left option-card"
            style={{
              borderColor: value === opt.value ? "var(--primary)" : "transparent",
              backgroundColor: value === opt.value ? "var(--ember-bg)" : "var(--surface-1)",
              color: value === opt.value ? "var(--ember-text)" : "var(--foreground)",
              fontWeight: value === opt.value ? 700 : 500,
              transition: "all 0.15s",
            }}
            aria-pressed={value === opt.value}
          >
            <span style={{ fontSize: "0.9rem" }}>{opt.label}</span>
            {opt.hint && (
              <span className="block" style={{ fontSize: "0.75rem", marginTop: 1, color: "var(--muted-foreground)" }}>{opt.hint}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  settings: A11ySettings;
  onChange: (s: A11ySettings) => void;
}

export function AccessibilityStep({ settings, onChange }: Props) {
  const update = (patch: Partial<A11ySettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="space-y-5">
      <OptionGroup
        label="Text size"
        value={settings.fontSize}
        onChange={(v) => update({ fontSize: v })}
        options={[
          { value: "normal", label: "Normal" },
          { value: "large", label: "Large" },
          { value: "xlarge", label: "Extra large" },
        ]}
      />

      <OptionGroup
        label="Font"
        value={settings.font}
        onChange={(v) => update({ font: v })}
        options={[
          { value: "standard", label: "Standard" },
          { value: "readable", label: "Extra readable", hint: "Wider letter spacing" },
        ]}
      />

      <OptionGroup
        label="Line spacing"
        value={settings.lineSpacing}
        onChange={(v) => update({ lineSpacing: v })}
        options={[
          { value: "normal", label: "Normal" },
          { value: "spacious", label: "Spacious" },
        ]}
      />

      <div className="space-y-3">
        <ToggleRow
          label="Reduce motion"
          description="Turns off animations, like the fade-ins you're seeing right now"
          value={settings.reduceMotion}
          onChange={(v) => update({ reduceMotion: v })}
        />
        <ToggleRow
          label="High contrast"
          description="Stronger borders and darker text for better visibility"
          value={settings.highContrast}
          onChange={(v) => update({ highContrast: v })}
        />
        <ToggleRow
          label="Dark mode"
          description="Switch to a darker color palette"
          value={settings.darkMode}
          onChange={(v) => update({ darkMode: v })}
        />
      </div>

      <p
        className="rounded-xl px-4 py-3"
        style={{ backgroundColor: "var(--glass-bg)", color: "var(--glass-text)", fontSize: "0.85rem", lineHeight: 1.6 }}
      >
        Every setting here applies instantly and can be changed again later — nothing is locked in.
      </p>
    </div>
  );
}
