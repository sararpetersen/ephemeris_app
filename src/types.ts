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
  { key: "mosshide", name: "Mosshide", emoji: "🍃", image: "/images/mosshide.webp", represents: "Calm and settled – an ordinary day" },
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

export const PRONOUN_OPTIONS = ["she/her", "he/him", "they/them", "she/they", "he/they", "it/its", "any pronouns", "prefer not to say"] as const;

export const AVATARS = ["🐉", "🐲", "🥚", "🦎", "🔥", "❄️", "⭐", "🌙", "🍃", "🌊", "🌵", "🌫️"];

export const CONTEXT_TAGS = [
  { key: "home", emoji: "🏠", label: "Home" },
  { key: "work", emoji: "💼", label: "Work/school" },
  { key: "social", emoji: "👥", label: "Social" },
  { key: "out", emoji: "🚌", label: "Out and about" },
] as const;

export interface Sighting {
  id: string;
  dragonKey: string;
  context: string[];
  note: string;
  timestamp: number;
}

export interface ProfileData {
  name: string;
  pronoun: string;
  avatar: string;
  avatarPhoto: string;
  sensory: string[];
  support: string[];
  dragonRoster: string[];
  a11y: A11ySettings;
}

export const DEFAULT_PROFILE: ProfileData = {
  name: "",
  pronoun: "",
  avatar: "🐉",
  avatarPhoto: "",
  sensory: [],
  support: [],
  dragonRoster: [],
  a11y: DEFAULT_A11Y,
};
