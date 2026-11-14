import { loadBundle } from "@/lib/registry";
import Desktop, { type SkillRow } from "./Desktop";

export const revalidate = 60;

export default async function Home() {
  const { bundle, source } = await loadBundle();
  const skills: SkillRow[] = Object.values(bundle.skills)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => ({
      name: s.name,
      summary: s.summary,
      version: s.canonical.version,
      platforms: Object.fromEntries(
        bundle.platforms.map((p) => [p, { state: s.platforms[p]?.state ?? "missing", version: s.platforms[p]?.version ?? null }]),
      ),
    }));
  return <Desktop skills={skills} platforms={bundle.platforms} live={source.startsWith("live")} />;
}
