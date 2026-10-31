#!/usr/bin/env python3
"""
ALL SEEING EYES skill registry tool.

One folder per skill under registry/<skill>/:
  skill.json                    version + drift metadata (source of truth)
  platforms/<platform>/...      that platform's copy (claude, gemini, grok, chatgpt, ...)

Any platform name is allowed. Known platforms get a nicer label and entry file;
new ones (a newly connected LLM) are picked up automatically.

Commands:
  status [--check]          rebuild STATUS.md, index.json, bundle.json, Claude Code plugin
  bump <skill> <platform>   record a new version of one platform copy
  import <skill> <platform> <src_dir>
                            copy a folder in as that platform's copy, then bump
  ingest <submissions.json> apply submissions queued by the skills MCP server
  fill-hashes [--base REF]  record hashes for copies saved without one; refuses edits
                            that changed files but kept the version at REF
"""
import argparse
import datetime as dt
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REG = ROOT / "registry"
DIST = ROOT / "dist" / "claude"
MARKET = ROOT / ".claude-plugin" / "marketplace.json"
PLUGIN_NAME = "all-seeing-eyes"
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")

KNOWN = {
    "claude": {"label": "Claude", "entry": "SKILL.md"},
    "gemini": {"label": "Gemini", "entry": "GEM.md"},
    "grok": {"label": "Grok", "entry": "PROJECT.md"},
    "chatgpt": {"label": "ChatGPT", "entry": "GPT.md"},
    "perplexity": {"label": "Perplexity", "entry": "SPACE.md"},
}
CORE = ["claude", "gemini", "grok", "perplexity"]


def label(p):
    return KNOWN.get(p, {}).get("label", p.replace("-", " ").title())


def entry(p):
    return KNOWN.get(p, {}).get("entry", "SKILL.md")


def today():
    return dt.date.today().isoformat()


def vtuple(v):
    nums = [int(x) for x in re.findall(r"\d+", v or "")][:3]
    return tuple(nums + [0] * (3 - len(nums)))


def vstr(t):
    return ".".join(map(str, t))


def bump_version(v, part="patch"):
    major, minor, patch = vtuple(v)
    if part == "major":
        return f"{major + 1}.0.0"
    if part == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def dir_hash(path: Path):
    if not path.exists():
        return None
    h = hashlib.sha256()
    for f in sorted(p for p in path.rglob("*") if p.is_file()):
        h.update(str(f.relative_to(path)).encode())
        h.update(f.read_bytes())
    return h.hexdigest()[:12]


def load(skill_dir: Path):
    return json.loads((skill_dir / "skill.json").read_text())


def save(skill_dir: Path, data):
    skill_dir.mkdir(parents=True, exist_ok=True)
    (skill_dir / "skill.json").write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def frontmatter(md: Path):
    out = {}
    if not md.exists():
        return out
    m = re.match(r"^---\n(.*?)\n---", md.read_text(), re.S)
    if not m:
        return out
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def skills():
    if not REG.exists():
        return []
    return sorted(d for d in REG.iterdir() if d.is_dir() and (d / "skill.json").exists())


def all_platforms():
    found = set(CORE)
    for sd in skills():
        found.update(load(sd).get("platforms", {}).keys())
        pdir = sd / "platforms"
        if pdir.exists():
            found.update(d.name for d in pdir.iterdir() if d.is_dir())
    extra = sorted(found - set(CORE))
    return CORE + extra


def new_record(skill, summary=""):
    return {"name": skill, "summary": summary,
            "canonical": {"platform": None, "version": "0.0.0", "updated": today()},
            "platforms": {}, "changelog": []}


def platform_state(skill_dir, data, p):
    meta = data["platforms"].get(p, {})
    actual = dir_hash(skill_dir / "platforms" / p)
    if actual is None:
        return "missing", meta
    if meta.get("hash") and meta["hash"] != actual:
        return "unversioned-edit", meta
    if p == data["canonical"].get("platform"):
        return "current", meta
    if vtuple(meta.get("synced_from")) >= vtuple(data["canonical"]["version"]) and meta.get("synced_from"):
        return "current", meta
    return "behind", meta


ICON = {"current": "🟢 current", "behind": "🟠 behind", "missing": "⚪ missing",
        "unversioned-edit": "🔴 edited, not bumped"}


def cmd_status(check=False):
    plats = all_platforms()
    rows, index, problems, bundle = [], [], [], {"generated": today(), "platforms": plats, "skills": {}}
    for sd in skills():
        data = load(sd)
        entry_ = {"name": data["name"], "summary": data.get("summary", ""),
                  "canonical": data["canonical"], "platforms": {}}
        files = {}
        cells = []
        for p in plats:
            state, meta = platform_state(sd, data, p)
            entry_["platforms"][p] = {"state": state, "version": meta.get("version"),
                                      "updated": meta.get("updated"), "synced_from": meta.get("synced_from")}
            v = f" v{meta['version']}" if meta.get("version") and state != "missing" else ""
            cells.append(f"{ICON[state]}{v}")
            if state == "unversioned-edit":
                problems.append(f"{data['name']}/{p}: files changed without a version bump")
            pdir = sd / "platforms" / p
            if pdir.exists():
                files[p] = {str(f.relative_to(pdir)): f.read_text(errors="replace")
                            for f in sorted(pdir.rglob("*")) if f.is_file()}
        index.append(entry_)
        bundle["skills"][data["name"]] = {**entry_, "changelog": data.get("changelog", [])[:10], "files": files}
        c = data["canonical"]
        cp = label(c["platform"]) if c.get("platform") else "none"
        rows.append(f"| [{data['name']}]({sd.name}/) | v{c['version']} ({cp}, {c['updated']}) | " + " | ".join(cells) + " |")

    queue = [(e["name"], p) for e in index for p, s in e["platforms"].items()
             if s["state"] in ("behind", "missing") and p in CORE or s["state"] == "behind"]
    queue = sorted(set(queue))
    lines = [
        "# Skill Registry Status", "",
        "Generated by `tools/registry.py`. Do not edit by hand.", "",
        f"Skills tracked: {len(index)}  |  Platforms: {', '.join(label(p) for p in plats)}  |  Copies needing work: {len(queue)}", "",
        "| Skill | Canonical | " + " | ".join(label(p) for p in plats) + " |",
        "|---|---|" + "---|" * len(plats),
        *rows, "", "## Port queue", "",
    ]
    lines += [f"- `{n}` to {label(p)}" for n, p in queue] or ["Nothing to port. Every platform is current."]
    lines += ["", "## Legend", "",
              "- 🟢 current: canonical copy, or ported from the current canonical version",
              "- 🟠 behind: exists but predates the canonical version",
              "- ⚪ missing: no copy for that platform yet",
              "- 🔴 edited, not bumped: files changed but `skill.json` was not updated", ""]
    (REG / "STATUS.md").write_text("\n".join(lines))
    (REG / "index.json").write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n")
    (REG / "bundle.json").write_text(json.dumps(bundle, ensure_ascii=False) + "\n")
    build_claude_mirror()
    if problems:
        print("\n".join(problems), file=sys.stderr)
        if check:
            sys.exit(1)
    print(f"OK: {len(index)} skills, {len(plats)} platforms, {len(queue)} copies need work")


def build_claude_mirror():
    if DIST.exists():
        shutil.rmtree(DIST)
    names = []
    for sd in skills():
        src = sd / "platforms" / "claude"
        if (src / "SKILL.md").exists():
            shutil.copytree(src, DIST / sd.name)
            names.append(sd.name)
    if not MARKET.exists():
        return
    m = json.loads(MARKET.read_text())
    m["plugins"] = [p for p in m["plugins"] if p["name"] != PLUGIN_NAME]
    m["plugins"].append({
        "name": PLUGIN_NAME,
        "description": "ALL SEEING EYES (@allsxxingeyes) custom skills, auto-built from registry/",
        "source": "./", "strict": False,
        "skills": [f"./dist/claude/{n}" for n in names],
    })
    MARKET.write_text(json.dumps(m, indent=2, ensure_ascii=False) + "\n")


def apply_version(sd, platform, note, promote=False, part="patch", force_version=None, synced_from=None):
    """Record a new version for files already in place at registry/<skill>/platforms/<platform>/."""
    data = load(sd) if (sd / "skill.json").exists() else new_record(sd.name)
    pdir = sd / "platforms" / platform
    meta = data["platforms"].get(platform, {})
    canon = data["canonical"]
    if force_version:
        new_v = vstr(vtuple(force_version))
    elif meta.get("version"):
        new_v = bump_version(meta["version"], part)
    else:
        new_v = "1.0.0"
    becomes_canonical = promote or canon.get("platform") in (None, platform)
    if becomes_canonical and vtuple(new_v) <= vtuple(canon["version"]) and canon.get("platform") != platform:
        new_v = bump_version(canon["version"], part)
    rec = {"version": new_v, "updated": today(), "hash": dir_hash(pdir), "entry": entry(platform)}
    if synced_from:
        rec["synced_from"] = synced_from
    data["platforms"][platform] = rec
    if becomes_canonical:
        data["canonical"] = {"platform": platform, "version": new_v, "updated": today()}
    if not data.get("summary"):
        data["summary"] = frontmatter(pdir / "SKILL.md").get("description", "")
    data["changelog"].insert(0, {"version": new_v, "date": today(), "platform": platform,
                                 "note": note or "Updated"})
    data["changelog"] = data["changelog"][:50]
    save(sd, data)
    return new_v, data["canonical"]


def replace_platform_dir(sd, platform, populate):
    """Build the new copy in a temp dir first; swap it in only once it is complete."""
    dest = sd / "platforms" / platform
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(dir=dest.parent, prefix=f".{platform}-"))
    try:
        populate(tmp)
        if not any(tmp.rglob("*")):
            raise ValueError("new copy is empty")
        old = None
        if dest.exists():
            old = dest.with_name(f".{platform}-old")
            if old.exists():
                shutil.rmtree(old)
            dest.rename(old)
        tmp.rename(dest)
        if old:
            shutil.rmtree(old)
    finally:
        if tmp.exists():
            shutil.rmtree(tmp)


def check_names(skill, platform):
    for n in (skill, platform):
        if not NAME_RE.match(n):
            sys.exit(f"Invalid name {n!r}: use lowercase letters, digits and hyphens")


def cmd_import(skill, platform, src, note, promote, version=None):
    check_names(skill, platform)
    src = Path(src)
    if not src.is_dir():
        sys.exit(f"Source folder not found: {src}")
    sd = REG / skill
    replace_platform_dir(sd, platform, lambda tmp: shutil.copytree(src, tmp, dirs_exist_ok=True))
    v, c = apply_version(sd, platform, note, promote, force_version=version)
    print(f"{skill}/{platform} -> v{v} (canonical: {c['platform']} v{c['version']})")


def cmd_bump(skill, platform, note, promote, part):
    check_names(skill, platform)
    sd = REG / skill
    if not (sd / "platforms" / platform).exists():
        sys.exit(f"No files at {sd / 'platforms' / platform}")
    v, c = apply_version(sd, platform, note, promote, part)
    print(f"{skill}/{platform} -> v{v} (canonical: {c['platform']} v{c['version']})")


def safe_rel(path):
    p = Path(path)
    if p.is_absolute() or ".." in p.parts or not path.strip():
        raise ValueError(f"unsafe path {path!r}")
    return p


def cmd_ingest(path):
    """Apply submissions queued by the MCP server. Prints JSON of applied ids."""
    subs = json.loads(Path(path).read_text())
    ledger = REG / "applied.json"
    done = json.loads(ledger.read_text()) if ledger.exists() else []
    seen = set(done)
    applied, skipped = [], []
    for s in sorted(subs, key=lambda x: x.get("received", "")):
        sid = s.get("id")
        if sid in seen:
            continue
        if sid:
            done.append(sid)
            seen.add(sid)
        try:
            skill, platform = s["skill"], s["platform"]
            if not (NAME_RE.match(skill) and NAME_RE.match(platform)):
                raise ValueError("bad skill or platform name")
            files = s["files"]
            if not files or len(files) > 60:
                raise ValueError("submission needs 1 to 60 files")

            def populate(tmp, files=files):
                for rel, content in files.items():
                    f = tmp / safe_rel(rel)
                    f.parent.mkdir(parents=True, exist_ok=True)
                    f.write_text(content)

            sd = REG / skill
            probe = Path(tempfile.mkdtemp())
            populate(probe)
            unchanged = dir_hash(probe) == dir_hash(sd / "platforms" / platform)
            shutil.rmtree(probe)
            if unchanged:
                skipped.append({"id": sid, "reason": "identical to stored copy"})
                continue
            synced = None
            if s.get("ported_from_canonical") and (sd / "skill.json").exists():
                synced = load(sd)["canonical"]["version"]
            replace_platform_dir(sd, platform, populate)
            v, c = apply_version(sd, platform, s.get("note") or f"Submitted from {label(platform)}",
                                 bool(s.get("promote")), synced_from=synced)
            applied.append({"id": sid, "skill": skill, "platform": platform, "version": v})
        except Exception as e:  # keep going; report the failure back
            skipped.append({"id": sid, "reason": str(e)})
    REG.mkdir(exist_ok=True)
    ledger.write_text(json.dumps(done[-1000:], indent=1) + "\n")
    print(json.dumps({"applied": applied, "skipped": skipped}))


def cmd_fill_hashes(base):
    """Hash copies saved without one, but only if their version moved since BASE."""
    bad = []
    for sd in skills():
        d = load(sd)
        prior = {}
        if base:
            r = subprocess.run(["git", "show", f"{base}:registry/{sd.name}/skill.json"],
                               cwd=ROOT, capture_output=True, text=True)
            if r.returncode == 0:
                prior = json.loads(r.stdout).get("platforms", {})
        changed = False
        for p, meta in d["platforms"].items():
            if meta.get("version") and not meta.get("hash"):
                was = prior.get(p, {})
                if was.get("version") and was["version"] == meta["version"]:
                    bad.append(f"{sd.name}/{p}: files changed but version stayed {meta['version']}")
                    continue
                meta["hash"] = dir_hash(sd / "platforms" / p)
                changed = True
        if changed:
            save(sd, d)
    if bad:
        print("\n".join(bad), file=sys.stderr)
        sys.exit(1)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("status"); s.add_argument("--check", action="store_true")
    b = sub.add_parser("bump"); b.add_argument("skill"); b.add_argument("platform")
    b.add_argument("--note"); b.add_argument("--canonical", action="store_true")
    g = b.add_mutually_exclusive_group(); g.add_argument("--minor", action="store_true"); g.add_argument("--major", action="store_true")
    i = sub.add_parser("import"); i.add_argument("skill"); i.add_argument("platform"); i.add_argument("src")
    i.add_argument("--note"); i.add_argument("--canonical", action="store_true"); i.add_argument("--version")
    n = sub.add_parser("ingest"); n.add_argument("path")
    f = sub.add_parser("fill-hashes"); f.add_argument("--base")
    a = ap.parse_args()
    if a.cmd == "status":
        cmd_status(a.check)
    elif a.cmd == "bump":
        cmd_bump(a.skill, a.platform, a.note, a.canonical, "major" if a.major else "minor" if a.minor else "patch")
    elif a.cmd == "import":
        cmd_import(a.skill, a.platform, a.src, a.note, a.canonical, a.version)
    elif a.cmd == "ingest":
        cmd_ingest(a.path)
    elif a.cmd == "fill-hashes":
        cmd_fill_hashes(a.base)


if __name__ == "__main__":
    main()
