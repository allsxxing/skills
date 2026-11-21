"use client";

import { useCallback, useEffect, useState } from "react";
import { siGiphy, siGithub, siInstagram, siX } from "simple-icons";
import { APPS, CONTACT, ENDPOINTS, HEALTH_URL, MCP_URL, PROMPTS_MENU, PROMPTS, REPO_URL, SOCIALS, TOOLS } from "@/lib/site";

export interface SkillRow {
  name: string;
  summary: string;
  version: string;
  platforms: Record<string, { state: string; version: string | null }>;
}

type WinId = "connect" | "tools" | "skills" | "resources" | "socials";
const WINDOWS: { id: WinId; title: string; x: number; y: number; w: number }[] = [
  { id: "connect", title: "Connect", x: 300, y: 70, w: 560 },
  { id: "tools", title: "Tools", x: 360, y: 110, w: 560 },
  { id: "skills", title: "Skills", x: 240, y: 90, w: 720 },
  { id: "resources", title: "Resources", x: 420, y: 130, w: 520 },
  { id: "socials", title: "Socials", x: 380, y: 160, w: 420 },
];
const SOCIAL_ICONS: Record<string, { path: string }> = { instagram: siInstagram, x: siX, giphy: siGiphy, github: siGithub };
const STATE_MARK: Record<string, string> = { current: "●", behind: "◐", missing: "○", "unversioned-edit": "◆" };

function DeskIcon({ id }: { id: WinId }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "miter" as const };
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
      {id === "connect" && (
        <>
          <rect x="5" y="15" width="14" height="14" {...common} />
          <rect x="25" y="15" width="14" height="14" {...common} fill="var(--bolt)" />
          <path d="M19 22h6" {...common} />
          <path d="M1 19h4M1 25h4M39 19h4M39 25h4" {...common} />
        </>
      )}
      {id === "tools" && (
        <>
          <rect x="6" y="6" width="32" height="32" {...common} />
          <path d="M6 14h32" {...common} />
          <path d="M14 20v12M22 20v12M30 20v12" {...common} />
          <rect x="11" y="27" width="6" height="4" fill="var(--bolt)" stroke="currentColor" strokeWidth="2" />
          <rect x="19" y="21" width="6" height="4" fill="currentColor" />
          <rect x="27" y="25" width="6" height="4" fill="currentColor" />
        </>
      )}
      {id === "skills" && (
        <>
          <path d="M4 12h14l4 4h18v20H4z" {...common} />
          <path d="M4 20h36" {...common} />
          <rect x="10" y="25" width="16" height="4" fill="var(--bolt)" stroke="currentColor" strokeWidth="2" />
        </>
      )}
      {id === "resources" && (
        <>
          <path d="M10 4h18l8 8v28H10z" {...common} />
          <path d="M28 4v8h8" {...common} />
          <rect x="15" y="18" width="14" height="5" fill="var(--bolt)" stroke="currentColor" strokeWidth="2" />
          <path d="M15 28h14M15 33h8" {...common} />
        </>
      )}
      {id === "socials" && (
        <>
          <path d="M5 8h34v22H22l-8 8v-8H5z" {...common} />
          <rect x="11" y="15" width="5" height="5" fill="currentColor" />
          <rect x="20" y="15" width="5" height="5" fill="var(--bolt)" stroke="currentColor" strokeWidth="2" />
          <rect x="29" y="15" width="5" height="5" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked: the text stays selectable */
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

function Clock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date()));
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []);
  return <span className="clock">{now ?? " "}</span>;
}

export default function Desktop({ skills, platforms, live }: { skills: SkillRow[]; platforms: string[]; live: boolean }) {
  const [open, setOpen] = useState<WinId[]>([]);
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const [app, setApp] = useState<string>(APPS[0].id);

  const show = useCallback((id: WinId) => setOpen((o) => [...o.filter((w) => w !== id), id]), []);
  const close = useCallback((id: WinId) => setOpen((o) => o.filter((w) => w !== id)), []);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1) as WinId;
      if (WINDOWS.some((w) => w.id === id)) show(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen((o) => o.slice(0, -1));
    };
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener("keydown", esc);
    };
  }, [show]);

  const drag = (id: WinId, start: { x: number; y: number }) => (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (window.matchMedia("(max-width: 820px)").matches) return;
    show(id);
    const ox = e.clientX - start.x;
    const oy = e.clientY - start.y;
    const move = (ev: PointerEvent) =>
      setPos((p) => ({ ...p, [id]: { x: Math.max(-200, ev.clientX - ox), y: Math.max(36, ev.clientY - oy) } }));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const behind = skills.reduce((n, s) => n + Object.values(s.platforms).filter((p) => p.state !== "current").length, 0);
  const steps = APPS.find((a) => a.id === app)!.steps;

  const body: Record<WinId, React.ReactNode> = {
    connect: (
      <>
        <p>Paste this address into any AI app that accepts a custom MCP connector. No sign-in.</p>
        <div className="urlrow">
          <input readOnly value={MCP_URL} aria-label="Connector URL" onFocus={(e) => e.currentTarget.select()} />
          <CopyButton text={MCP_URL} label="Copy URL" />
        </div>
        <div className="tabs" role="tablist" aria-label="App">
          {APPS.map((a) => (
            <button key={a.id} role="tab" aria-selected={app === a.id} className={app === a.id ? "tab on" : "tab"} onClick={() => setApp(a.id)}>
              {a.label}
            </button>
          ))}
        </div>
        <ol className="steps">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="note">
          To check it worked, ask the app: <b>Run skills_whoami.</b>
        </p>
        <p className="note">
          The address above can read the registry. Saving skills back needs a private write key added to the end as{" "}
          <code>?key=…</code>. Keep that version of the address to yourself.
        </p>

        <h3>Once connected, the app shows these commands</h3>
        <ul className="tools">
          {PROMPTS_MENU.map((p) => (
            <li key={p.name}>
              <code>{p.name}</code>
              <p>{p.does}</p>
            </li>
          ))}
        </ul>

        <h3>If an app will not connect</h3>
        <ul className="tools">
          {ENDPOINTS.map((e) => (
            <li key={e.id}>
              <code>{e.url}</code> <span className="tag">{e.label}</span>
              <p>{e.note}</p>
            </li>
          ))}
        </ul>
        <p className="note">
          Start at <a href={HEALTH_URL} target="_blank" rel="noreferrer">the health check</a>. If it answers, the server is fine and the
          problem is the app&apos;s connector form.
        </p>
      </>
    ),
    tools: (
      <>
        <p>Once connected, the app can call these. You ask in plain words and the app picks the tool.</p>
        <ul className="tools">
          {TOOLS.map((t) => (
            <li key={t.name}>
              <code>{t.name}</code>
              <span className={t.access === "save" ? "tag save" : "tag"}>{t.access === "save" ? "needs key" : "read"}</span>
              <p>{t.does}</p>
            </li>
          ))}
        </ul>
      </>
    ),
    skills: (
      <>
        <p>
          {skills.length} skills, read {live ? "live from GitHub" : "from the last deploy"}. Each column is one app&apos;s copy.
        </p>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Skill</th>
                <th>Newest</th>
                {platforms.map((p) => (
                  <th key={p}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => (
                <tr key={s.name}>
                  <td title={s.summary}>{s.name}</td>
                  <td>{s.version}</td>
                  {platforms.map((p) => {
                    const st = s.platforms[p];
                    return (
                      <td key={p} className={`st ${st.state}`} title={st.state}>
                        <span aria-hidden="true">{STATE_MARK[st.state] ?? "○"}</span> {st.version ?? <span className="sr">{st.state}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">● current&nbsp;&nbsp; ◐ behind&nbsp;&nbsp; ○ not ported yet&nbsp;&nbsp; ◆ edited without a version bump</p>
      </>
    ),
    resources: (
      <>
        <ul className="links">
          <li><a href={REPO_URL} target="_blank" rel="noreferrer">The registry on GitHub</a><span>Every skill, every app version, full history.</span></li>
          <li><a href={`${REPO_URL}/blob/main/registry/STATUS.md`} target="_blank" rel="noreferrer">Status board</a><span>Which copies are current and which have drifted.</span></li>
          <li><a href={`${REPO_URL}/blob/main/registry/README.md`} target="_blank" rel="noreferrer">How the registry works</a><span>Layout, versioning and how apps save skills back.</span></li>
        </ul>
        <h3>Things to ask a connected app</h3>
        <ul className="prompts">
          {PROMPTS.map((p) => (
            <li key={p}>
              <span>{p}</span>
              <CopyButton text={p} />
            </li>
          ))}
        </ul>
      </>
    ),
    socials: (
      <>
        <img className="banner" src="/brand/banner.gif" alt="ALL SEEING EYES banner with the XX mark" width={1040} height={160} />
        <p>producer of visuals + awesomeness</p>
        <ul className="socials">
          {SOCIALS.map((s) => (
            <li key={s.id}>
              <a href={s.href} target="_blank" rel="noreferrer me">
                <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                  <path d={SOCIAL_ICONS[s.id].path} fill="currentColor" />
                </svg>
                <span>
                  <b>{s.label}</b>
                  {s.handle}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </>
    ),
  };

  return (
    <div className="desk">
      <header className="menubar">
        <a className="mark" href="#" onClick={() => setOpen([])}>
          <img src="/brand/xx-circle.gif" alt="" width={22} height={22} /> [@allsxxing]
        </a>
        <nav aria-label="Windows">
          {WINDOWS.map((w) => (
            <button key={w.id} onClick={() => show(w.id)}>
              {w.title}
            </button>
          ))}
        </nav>
        <span className="status">
          <i className={live ? "dot on" : "dot"} /> {skills.length} skills {live ? "live" : "cached"}
        </span>
        <Clock />
      </header>

      <main className="wallpaper">
        <aside className="widget">
          <div className="widget-title">Houston</div>
          <div className="widget-time"><Clock /></div>
          <dl>
            <div><dt>Skills</dt><dd>{skills.length}</dd></div>
            <div><dt>Apps tracked</dt><dd>{platforms.length}</dd></div>
            <div><dt>Copies to catch up</dt><dd>{behind}</dd></div>
          </dl>
          <button className="widget-cta" onClick={() => show("connect")}>Connect an app</button>
        </aside>

        <section className="hero">
          <img className="logo" src="/brand/xx-circle.gif" alt="ALL SEEING EYES XX logo" width={180} height={180} />
          <h1>
            <span className="handle">[@allsxxing]</span>
            <span className="product">Skills MCP</span>
          </h1>
          <div className="stripe" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <p>One registry for every skill, on every AI app. Pick an icon to begin.</p>
        </section>

        <ul className="icons">
          {WINDOWS.map((w) => (
            <li key={w.id}>
              <button onClick={() => show(w.id)} aria-label={`Open ${w.title}`}>
                <DeskIcon id={w.id} />
                <span>{w.title}</span>
              </button>
            </li>
          ))}
        </ul>

        <img className="sticker" src="/brand/htown.gif" alt="HTOWN spray sticker" width={400} height={400} loading="lazy" />
        <div className="tv" aria-hidden="true">
          {["new", "banger", "gifxgod", "blessed", "godisgood"].map((t) => (
            <img key={t} src={`/brand/tv-${t}.gif`} alt="" height={30} loading="lazy" />
          ))}
        </div>

        {open.map((id, z) => {
          const w = WINDOWS.find((x) => x.id === id)!;
          const p = pos[id] ?? { x: w.x, y: w.y };
          return (
            <section
              key={id}
              className={z === open.length - 1 ? "window top" : "window"}
              role="dialog"
              aria-label={w.title}
              style={{ left: p.x, top: p.y, width: w.w, zIndex: 20 + z }}
              onPointerDown={() => z !== open.length - 1 && show(id)}
            >
              <div className="titlebar" onPointerDown={drag(id, p)}>
                <button className="close" aria-label={`Close ${w.title}`} onClick={() => close(id)} />
                <span>{w.title}</span>
              </div>
              <div className="content">{body[id]}</div>
            </section>
          );
        })}
      </main>

      <footer className="foot">
        <span className="tvbox">ALL SEEING EYES (@allsxxingeyes). Houston, TX.</span>
        <ul className="contact">
          {CONTACT.map((c) => (
            <li key={c.label}>
              <a className="tvbox" href={c.href} {...(c.href.startsWith("http") ? { target: "_blank", rel: "noreferrer me" } : {})}>
                [{c.label}] {c.text}
              </a>
            </li>
          ))}
        </ul>
        <ul className="apps">
          {SOCIALS.map((s) => (
            <li key={s.id}>
              <a className={`app ${s.id}`} href={s.href} target="_blank" rel="noreferrer me" aria-label={`${s.label} ${s.handle}`}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d={SOCIAL_ICONS[s.id].path} fill="currentColor" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
