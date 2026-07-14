import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Settings as SettingsIcon } from "lucide-react";
import { CONTEXT_TAGS, DRAGON_SPECIES, type ProfileData, type Sighting, type SightingPatch } from "../types";
import { useInView } from "../hooks/useInView";
import { revealClass, revealStyle } from "../utils/reveal";

function calendarDayDiff(ts: number, now: number): number {
  const a = new Date(ts);
  const b = new Date(now);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function relativeTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  const days = calendarDayDiff(ts, now);
  if (days === 0) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isToday(ts: number): boolean {
  const date = new Date(ts);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function localDayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function monthLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function pickMoodDragons(profile: ProfileData) {
  const preferred = DRAGON_SPECIES.filter((d) => profile.dragonRoster.includes(d.key)).sort(() => Math.random() - 0.5);
  const others = DRAGON_SPECIES.filter((d) => !profile.dragonRoster.includes(d.key)).sort(() => Math.random() - 0.5);
  return [...preferred, ...others].slice(0, 3).sort(() => Math.random() - 0.5);
}

interface Props {
  profile: ProfileData;
  sightings: Sighting[];
  onLog: (s: Sighting) => void;
  onUpdateSighting: (id: string, patch: SightingPatch) => void;
  onOpenSettings: () => void;
  accountLabel: ReactNode;
}

export function Home({ profile, sightings, onLog, onUpdateSighting, onOpenSettings, accountLabel }: Props) {
  const [moodDragons, setMoodDragons] = useState(() => pickMoodDragons(profile));
  const [selectedDragon, setSelectedDragon] = useState<string | null>(null);
  const [activeSightingId, setActiveSightingId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [justLogged, setJustLogged] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [currentDay, setCurrentDay] = useState(localDayKey);
  const previousDay = useRef(currentDay);
  const [, forceTick] = useState(0);
  const header = useInView<HTMLDivElement>();
  const sightingCard = useInView<HTMLDivElement>();
  const divider = useInView<HTMLDivElement>();
  const journalCard = useInView<HTMLDivElement>();

  useEffect(() => {
    const recheck = () => {
      setCurrentDay(localDayKey());
      forceTick((n) => n + 1);
    };
    const interval = setInterval(recheck, 60_000);
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, []);

  useEffect(() => {
    if (previousDay.current === currentDay) return;
    previousDay.current = currentDay;
    setMoodDragons(pickMoodDragons(profile));
    setSelectedDragon(null);
    setActiveSightingId(null);
    setTags([]);
    setNote("");
    setJustLogged(false);
  }, [currentDay, profile]);

  const latestToday = sightings
    .filter((s) => isToday(s.timestamp))
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  const latestTodayDragon = latestToday ? DRAGON_SPECIES.find((d) => d.key === latestToday.dragonKey) : undefined;
  const todayLocked = Boolean(latestToday && !activeSightingId);
  const visibleSightings = activeSightingId ? sightings.filter((s) => s.id !== activeSightingId) : sightings;
  const archiveCutoff = Date.now() - THIRTY_DAYS_MS;
  const sortedSightings = [...visibleSightings].sort((a, b) => b.timestamp - a.timestamp);
  const recentSightings = sortedSightings.filter((s) => s.timestamp >= archiveCutoff);
  const archivedSightings = sortedSightings.filter((s) => s.timestamp < archiveCutoff);
  const archivedByMonth = archivedSightings.reduce<Record<string, Sighting[]>>((groups, sighting) => {
    const label = monthLabel(sighting.timestamp);
    (groups[label] ??= []).push(sighting);
    return groups;
  }, {});

  const toggleTag = (key: string) => setTags((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const logSighting = (dragonKey: string) => {
    if (activeSightingId) {
      onUpdateSighting(activeSightingId, { dragonKey });
      setSelectedDragon(dragonKey);
      return;
    }

    const sighting = {
      id: crypto.randomUUID(),
      dragonKey,
      context: [],
      note: "",
      timestamp: Date.now(),
    };
    onLog(sighting);
    setSelectedDragon(dragonKey);
    setActiveSightingId(sighting.id);
    setTags([]);
    setNote("");
    setJustLogged(true);
  };

  const saveDetails = () => {
    if (!activeSightingId) return;
    onUpdateSighting(activeSightingId, { context: tags, note: note.trim() });
    setActiveSightingId(null);
    setTags([]);
    setNote("");
    setTimeout(() => setJustLogged(false), 3000);
  };

  return (
    <div className="app-shell">
      <div className="max-w-lg mx-auto px-6 py-8 space-y-6" style={{ position: "relative" }}>
        {/* Header */}
        <div
          ref={header.ref}
          className={`flex items-center gap-4 ${revealClass(header.inView, "fadeInDown")}`}
          style={revealStyle()}
        >
          <div
            className="rounded-2xl flex items-center justify-center card-surface"
            style={{ width: 56, height: 56, backgroundColor: "var(--ember-bg)", fontSize: "2rem", overflow: "hidden" }}
          >
            {profile.avatarPhoto ? (
              <img src={profile.avatarPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              profile.avatar
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-heading" style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--foreground)", marginBottom: 6 }}>
              {profile.name ? `Hello, ${profile.name}` : "Hello, researcher"}
            </h1>
            <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}>{accountLabel}</p>
          </div>
          <button onClick={onOpenSettings} aria-label="Settings" className="p-3 rounded-full icon-hover" style={{ color: "var(--muted-foreground)" }}>
            <SettingsIcon size={22} />
          </button>
        </div>

        {/* Log a sighting */}
        <div
          ref={sightingCard.ref}
          className={`rounded-2xl border card-surface ${revealClass(sightingCard.inView)}`}
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", ...revealStyle() }}
        >
          <div className="accent-bar" />
          <div className="p-5 space-y-4">
            <div>
              <h2 className="font-heading" style={{ fontWeight: 700, color: "var(--foreground)" }}>
                Log a sighting
              </h2>
              <p style={{ fontSize: "0.88rem", color: "var(--muted-foreground)" }}>Which dragon has shown up? Tap one to record it.</p>
            </div>

            {latestTodayDragon && !activeSightingId && (
              <p
                className="rounded-xl px-4 py-3 flex items-center gap-2"
                style={{ backgroundColor: "var(--glass-bg)", color: "var(--glass-text)", fontSize: "0.88rem" }}
              >
                <Check size={16} /> Already logged today: {latestTodayDragon.name}.
              </p>
            )}

            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))" }}>
              {moodDragons.map((d) => {
                const active = selectedDragon === d.key;
                return (
                  <button
                    key={d.key}
                    onClick={() => logSighting(d.key)}
                    disabled={todayLocked}
                    className="dragon-tooltip rounded-xl p-3 border-2 text-center option-card"
                    style={{
                      backgroundColor: active ? "var(--ember-bg)" : "var(--surface-1)",
                      borderColor: active ? "var(--primary)" : "transparent",
                    }}
                    aria-pressed={active}
                    aria-label={`${d.name}: ${d.represents}`}
                    data-tooltip={d.represents}
                  >
                    <div style={{ opacity: todayLocked ? 0.62 : 1 }}>
                      <div className="rounded-lg mx-auto" style={{ width: 56, height: 56, overflow: "hidden" }}>
                        <img src={d.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </div>
                      <p
                        className="font-heading"
                        style={{ fontWeight: active ? 700 : 600, fontSize: "0.82rem", marginTop: 6, color: "var(--foreground)" }}
                      >
                        {d.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={`sighting-reveal ${activeSightingId ? "sighting-reveal-open" : ""}`}>
              <div className="sighting-reveal-inner space-y-3">
                {activeSightingId && (
                  <>
                    <p
                      className="rounded-xl px-4 py-3 flex items-center gap-2"
                      style={{ backgroundColor: "var(--glass-bg)", color: "var(--glass-text)", fontSize: "0.88rem" }}
                    >
                      <Check size={16} /> Sighting logged. Add details if you want.
                    </p>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 6, color: "var(--foreground)" }}>
                        Where are you? <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>(optional)</span>
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {CONTEXT_TAGS.map((t) => {
                          const active = tags.includes(t.key);
                          return (
                            <button
                              key={t.key}
                              onClick={() => toggleTag(t.key)}
                              className="rounded-xl px-3 py-2 border-2 option-card"
                              style={{
                                backgroundColor: active ? "var(--glass-bg)" : "var(--surface-1)",
                                borderColor: active ? "var(--glass-vivid)" : "transparent",
                                color: active ? "var(--glass-text)" : "var(--foreground)",
                                fontWeight: active ? 700 : 500,
                                fontSize: "0.85rem",
                              }}
                              aria-pressed={active}
                            >
                              {t.emoji} {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveDetails()}
                      placeholder="Field note (optional)"
                      className="w-full rounded-xl px-4 py-3 border outline-none"
                      style={{
                        backgroundColor: "var(--input-background)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        fontSize: "0.92rem",
                      }}
                    />
                    <button
                      onClick={saveDetails}
                      className="w-full rounded-2xl py-3.5 btn-primary"
                      style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)", fontWeight: 700, fontSize: "1rem" }}
                    >
                      Save details
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className={`sighting-reveal ${justLogged && !activeSightingId ? "sighting-reveal-open" : ""}`}>
              <div className="sighting-reveal-inner">
                {justLogged && !activeSightingId && (
                  <p
                    className="rounded-xl px-4 py-3 flex items-center gap-2"
                    style={{ backgroundColor: "var(--glass-bg)", color: "var(--glass-text)", fontSize: "0.88rem" }}
                  >
                    <Check size={16} /> Recorded in your field journal.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ornamental divider */}
        <div ref={divider.ref} aria-hidden="true" className={revealClass(divider.inView, "fadeIn")} style={revealStyle()}>
          <div style={{ textAlign: "center", color: "var(--muted-foreground)", opacity: 0.55, fontSize: "1.1rem", lineHeight: 1 }}>
            ❦
          </div>
        </div>

        {/* Field notes — styled like a journal page */}
        <div
          ref={journalCard.ref}
          className={`rounded-2xl border card-surface ${revealClass(journalCard.inView)}`}
          style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", ...revealStyle() }}
        >
          <div className="journal-page py-5 pr-5">
            <div className="journal-heading-row">
              <h2 className="font-heading" style={{ fontWeight: 700, color: "var(--foreground)" }}>
                Field notes
              </h2>
              <span style={{ fontStyle: "italic", fontSize: "0.82rem", color: "var(--muted-foreground)" }}>Recent sightings</span>
            </div>
            {visibleSightings.length === 0 ? (
              <p style={{ fontStyle: "italic", fontSize: "0.9rem", color: "var(--muted-foreground)" }}>Nothing logged yet — whenever you're ready.</p>
            ) : (
              <div>
                {recentSightings.length === 0 && (
                  <p style={{ fontStyle: "italic", fontSize: "0.9rem", color: "var(--muted-foreground)" }}>No sightings in the last 30 days.</p>
                )}
                {recentSightings.map((s) => {
                    const dragon = DRAGON_SPECIES.find((d) => d.key === s.dragonKey);
                    if (!dragon) return null;
                    const tagLabels = s.context
                      .map((k) => CONTEXT_TAGS.find((t) => t.key === k))
                      .filter(Boolean)
                      .map((t) => `${t!.emoji} ${t!.label}`);
                    return (
                      <div
                        key={s.id}
                        className="journal-entry flex items-start gap-3 py-3"
                      >
                        <div className="rounded-lg shrink-0" style={{ width: 44, height: 44, overflow: "hidden" }}>
                          <img src={dragon.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div className="flex-1" style={{ minWidth: 0 }}>
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="font-heading" style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--foreground)" }}>
                              {dragon.name}
                            </p>
                            <span style={{ fontStyle: "italic", fontSize: "0.75rem", color: "var(--muted-foreground)", flexShrink: 0 }}>
                              {relativeTime(s.timestamp)}
                            </span>
                          </div>
                          {tagLabels.length > 0 && (
                            <p style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", marginTop: 1 }}>{tagLabels.join(" · ")}</p>
                          )}
                          {s.note && <p style={{ fontStyle: "italic", fontSize: "0.88rem", marginTop: 4, color: "var(--foreground)" }}>{s.note}</p>}
                        </div>
                      </div>
                    );
                  })}

                {archivedSightings.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => setShowArchive((shown) => !shown)}
                      className="w-full rounded-xl px-4 py-3 border"
                      style={{
                        backgroundColor: "var(--surface-1)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        fontWeight: 700,
                      }}
                      aria-expanded={showArchive}
                    >
                      {showArchive ? "Hide older sightings" : `View older sightings (${archivedSightings.length})`}
                    </button>

                    {showArchive && (
                      <div style={{ marginTop: "1rem" }}>
                        {Object.entries(archivedByMonth).map(([month, entries]) => (
                          <section key={month} style={{ marginTop: "1rem" }}>
                            <h3
                              className="font-heading"
                              style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--muted-foreground)" }}
                            >
                              {month}
                            </h3>
                            {entries.map((s) => {
                              const dragon = DRAGON_SPECIES.find((d) => d.key === s.dragonKey);
                              if (!dragon) return null;
                              const tagLabels = s.context
                                .map((k) => CONTEXT_TAGS.find((t) => t.key === k))
                                .filter(Boolean)
                                .map((t) => `${t!.emoji} ${t!.label}`);
                              return (
                                <div key={s.id} className="journal-entry flex items-start gap-3 py-3">
                                  <div className="rounded-lg shrink-0" style={{ width: 44, height: 44, overflow: "hidden" }}>
                                    <img src={dragon.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                  </div>
                                  <div className="flex-1" style={{ minWidth: 0 }}>
                                    <div className="flex items-baseline justify-between gap-2">
                                      <p className="font-heading" style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--foreground)" }}>
                                        {dragon.name}
                                      </p>
                                      <span style={{ fontStyle: "italic", fontSize: "0.75rem", color: "var(--muted-foreground)", flexShrink: 0 }}>
                                        {new Date(s.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                      </span>
                                    </div>
                                    {tagLabels.length > 0 && (
                                      <p style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", marginTop: 1 }}>{tagLabels.join(" · ")}</p>
                                    )}
                                    {s.note && <p style={{ fontStyle: "italic", fontSize: "0.88rem", marginTop: 4, color: "var(--foreground)" }}>{s.note}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </section>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
