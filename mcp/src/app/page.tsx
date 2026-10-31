import { loadBundle } from "@/lib/registry";

export const revalidate = 60;

export default async function Home() {
  const { bundle, source } = await loadBundle();
  const skills = Object.values(bundle.skills).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "40px 16px" }}>
      <h1 style={{ fontSize: 22, letterSpacing: 1 }}>👁 ALL SEEING EYES · Skills MCP</h1>
      <p style={{ opacity: 0.75 }}>
        One registry for every skill @allsxxing runs across Claude, Gemini, Grok, ChatGPT, and Perplexity. Source:{" "}
        <a style={{ color: "#9ad" }} href="https://github.com/allsxxing/skills/blob/main/registry/STATUS.md">
          allsxxing/skills
        </a>{" "}
        ({source}).
      </p>
      <h2 style={{ fontSize: 16, marginTop: 32 }}>Connect</h2>
      <p style={{ opacity: 0.85 }}>
        Add a custom MCP connector pointing at <code>/api/mcp</code> on this host. Read-only without a key; append your write
        key to save skills back.
      </p>
      <h2 style={{ fontSize: 16, marginTop: 32 }}>Skills ({skills.length})</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 6 }}>Skill</th>
            {bundle.platforms.map((p) => (
              <th key={p} style={{ textAlign: "left", padding: 6 }}>
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skills.map((s) => (
            <tr key={s.name} style={{ borderTop: "1px solid #222" }}>
              <td style={{ padding: 6 }}>{s.name}</td>
              {bundle.platforms.map((p) => {
                const st = s.platforms[p]?.state ?? "missing";
                const icon = { current: "🟢", behind: "🟠", missing: "⚪", "unversioned-edit": "🔴" }[st];
                return (
                  <td key={p} style={{ padding: 6 }}>
                    {icon} {s.platforms[p]?.version ?? ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
