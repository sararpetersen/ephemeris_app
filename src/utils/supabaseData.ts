import { supabase } from "./supabaseClient";
import { DEFAULT_A11Y, type ProfileData, type Sighting } from "../types";

interface ProfileRow {
  user_id: string;
  name: string;
  pronoun: string;
  avatar: string;
  avatar_photo: string;
  sensory: string[];
  support: string[];
  dragon_roster: string[];
  a11y: ProfileData["a11y"];
}

interface SightingRow {
  id: string;
  user_id: string;
  dragon_key: string;
  context: string[];
  note: string;
  occurred_at: number;
}

function rowToProfile(row: ProfileRow): ProfileData {
  return {
    name: row.name,
    pronoun: row.pronoun,
    avatar: row.avatar,
    avatarPhoto: row.avatar_photo,
    sensory: row.sensory ?? [],
    support: row.support ?? [],
    dragonRoster: row.dragon_roster ?? [],
    a11y: { ...DEFAULT_A11Y, ...row.a11y },
  };
}

function rowToSighting(row: SightingRow): Sighting {
  return {
    id: row.id,
    dragonKey: row.dragon_key,
    context: row.context ?? [],
    note: row.note,
    timestamp: row.occurred_at,
  };
}

export async function fetchProfile(userId: string): Promise<ProfileData | null> {
  const { data, error } = await supabase.from("ephemeris_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? rowToProfile(data as ProfileRow) : null;
}

export async function saveProfileRemote(userId: string, profile: ProfileData): Promise<void> {
  const { error } = await supabase.from("ephemeris_profiles").upsert({
    user_id: userId,
    name: profile.name,
    pronoun: profile.pronoun,
    avatar: profile.avatar,
    avatar_photo: profile.avatarPhoto,
    sensory: profile.sensory,
    support: profile.support,
    dragon_roster: profile.dragonRoster,
    a11y: profile.a11y,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchSightings(userId: string): Promise<Sighting[]> {
  const { data, error } = await supabase
    .from("ephemeris_sightings")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: true });
  if (error) throw error;
  return (data as SightingRow[]).map(rowToSighting);
}

export async function insertSightingRemote(userId: string, sighting: Sighting): Promise<void> {
  const { error } = await supabase.from("ephemeris_sightings").insert({
    id: sighting.id,
    user_id: userId,
    dragon_key: sighting.dragonKey,
    context: sighting.context,
    note: sighting.note,
    occurred_at: sighting.timestamp,
  });
  if (error) throw error;
}

export async function updateSightingRemote(userId: string, id: string, patch: Pick<Sighting, "context" | "note">): Promise<void> {
  const { error } = await supabase
    .from("ephemeris_sightings")
    .update({ context: patch.context, note: patch.note })
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw error;
}

export async function replaceAllSightingsRemote(userId: string, sightings: Sighting[]): Promise<void> {
  const { error: deleteError } = await supabase.from("ephemeris_sightings").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;
  if (sightings.length === 0) return;
  const { error } = await supabase.from("ephemeris_sightings").insert(
    sightings.map((s) => ({
      id: s.id,
      user_id: userId,
      dragon_key: s.dragonKey,
      context: s.context,
      note: s.note,
      occurred_at: s.timestamp,
    })),
  );
  if (error) throw error;
}

export async function deleteAllRemoteData(userId: string): Promise<void> {
  await supabase.from("ephemeris_sightings").delete().eq("user_id", userId);
  await supabase.from("ephemeris_profiles").delete().eq("user_id", userId);
}
