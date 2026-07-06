export interface A11ySettings {
  fontSize: "normal" | "large" | "xlarge";
  font: "standard" | "readable";
  lineSpacing: "normal" | "spacious";
  reduceMotion: boolean;
  highContrast: boolean;
  darkMode: boolean;
}

export const DEFAULT_A11Y: A11ySettings = {
  fontSize: "normal",
  font: "standard",
  lineSpacing: "normal",
  reduceMotion: false,
  highContrast: false,
  darkMode: false,
};

export interface DragonSpecies {
  key: string;
  name: string;
  emoji: string;
  image: string;
  represents: string;
}

export const DRAGON_SPECIES: DragonSpecies[] = [
  { key: "ember", name: "Ember", emoji: "🔥", image: "/images/ember.webp", represents: "Running low on energy" },
  { key: "static-wings", name: "Static-wings", emoji: "⚡", image: "/images/static-wings.webp", represents: "Overstimulated, sensory overload" },
  { key: "glassscale", name: "Glassscale", emoji: "💎", image: "/images/glassscale.webp", represents: "Hyperfocus, flow state" },
  { key: "fog-drake", name: "Fog-drake", emoji: "🌫️", image: "/images/fog-drake.webp", represents: "Brain fog, hard to think" },
  { key: "thornback", name: "Thornback", emoji: "🌵", image: "/images/thornback.webp", represents: "Irritable, sensory-defensive" },
];

export const SENSORY_OPTIONS = [
  { key: "noise", emoji: "🔇", label: "Noise-sensitive" },
  { key: "light", emoji: "💡", label: "Light-sensitive" },
  { key: "movement", emoji: "🚶", label: "Need lots of movement" },
  { key: "stillness", emoji: "🧘", label: "Need stillness" },
  { key: "texture", emoji: "🤲", label: "Texture-sensitive" },
] as const;

export const SUPPORT_OPTIONS = [
  { key: "reminders", emoji: "🔔", label: "Gentle reminders" },
  { key: "checklists", emoji: "✅", label: "Checklists" },
  { key: "quiet", emoji: "🤫", label: "Quiet focus time" },
  { key: "written", emoji: "📋", label: "Written instructions" },
  { key: "time", emoji: "⏳", label: "Extra time to process" },
] as const;

export interface ProfileData {
  name: string;
  pronoun: string;
  avatar: string;
  sensory: string[];
  support: string[];
  dragonRoster: string[];
  a11y: A11ySettings;
}

export const DEFAULT_PROFILE: ProfileData = {
  name: "",
  pronoun: "",
  avatar: "🐉",
  sensory: [],
  support: [],
  dragonRoster: [],
  a11y: DEFAULT_A11Y,
};
