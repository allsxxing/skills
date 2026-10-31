// Registry reads. Always try the live bundle on GitHub main first (rebuilt by the Skill Registry
// action on every change), so answers are current within a minute of a merge; fall back to the
// snapshot bundled at deploy time.
import fallback from "@/data/bundle.json";

export interface PlatformState {
  state: "current" | "behind" | "missing" | "unversioned-edit";
  version?: string | null;
  updated?: string | null;
  synced_from?: string | null;
}

export interface SkillRecord {
  name: string;
  summary: string;
  canonical: { platform: string | null; version: string; updated: string };
  platforms: Record<string, PlatformState>;
  changelog: Array<{ version: string; date: string; platform: string; note: string }>;
  files: Record<string, Record<string, string>>;
}

export interface Bundle {
  generated: string | null;
  platforms: string[];
  skills: Record<string, SkillRecord>;
}

export const REPO = "allsxxing/skills";
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const TTL_MS = 60_000;

let cache: { at: number; bundle: Bundle; source: string } | null = null;

export async function loadBundle(): Promise<{ bundle: Bundle; source: string }> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache;
  try {
    const res = await fetch(`${RAW}/registry/bundle.json`, { cache: "no-store" });
    if (res.ok) {
      const bundle = (await res.json()) as Bundle;
      cache = { at: Date.now(), bundle, source: "live (GitHub main)" };
      return cache;
    }
  } catch {
    // fall through to the deploy-time snapshot
  }
  cache = { at: Date.now(), bundle: fallback as unknown as Bundle, source: "deploy snapshot" };
  return cache;
}

export async function appliedIds(): Promise<Set<string>> {
  try {
    const res = await fetch(`${RAW}/registry/applied.json`, { cache: "no-store" });
    if (!res.ok) return new Set();
    const ids = (await res.json()) as string[];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export function findSkill(bundle: Bundle, name: string): SkillRecord | undefined {
  const key = name.trim().toLowerCase();
  if (bundle.skills[key]) return bundle.skills[key];
  return Object.values(bundle.skills).find(
    (s) => s.name.toLowerCase() === key || s.name.toLowerCase().includes(key),
  );
}
