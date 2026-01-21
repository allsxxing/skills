#!/usr/bin/env python3
"""
Pull custom skill files from remote sources.

Usage:
    python pull-skill.py <source> --output <destination>

Examples:
    python pull-skill.py https://github.com/owner/repo/tree/main/skills/my-skill --output skills/
    python pull-skill.py /path/to/local/skill --output skills/
    python pull-skill.py https://example.com/skill.skill --output skills/
"""

import argparse
import shutil
import sys
import tempfile
import urllib.error
import urllib.request
import zipfile
from pathlib import Path
from urllib.parse import urlparse


def is_github_url(url: str) -> bool:
    """Check if URL is a GitHub repository path."""
    parsed = urlparse(url)
    return parsed.netloc == "github.com"


def is_skill_package(path: str) -> bool:
    """Check if path is a .skill package file."""
    return path.endswith(".skill")


def download_file(url: str, dest: Path, timeout: int = 60) -> None:
    """Download a file from URL to destination with timeout."""
    print(f"Downloading from {url}...")
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            with open(dest, "wb") as out_file:
                shutil.copyfileobj(response, out_file)
    except urllib.error.URLError as e:
        raise RuntimeError(f"Failed to download {url}: {e}")
    print(f"Downloaded to {dest}")


def safe_extract_zip(zf: zipfile.ZipFile, target_dir: Path) -> None:
    """Safely extract zip file, preventing zip slip attacks."""
    target_dir = target_dir.resolve()
    for member in zf.namelist():
        member_path = (target_dir / member).resolve()
        # Ensure the extracted file stays within target directory
        if not str(member_path).startswith(str(target_dir)):
            raise ValueError(f"Zip slip attack detected: {member}")
    zf.extractall(target_dir)


def extract_skill_package(package_path: Path, output_dir: Path) -> Path:
    """Extract a .skill package (zip file) to output directory."""
    print(f"Extracting skill package {package_path}...")
    with zipfile.ZipFile(package_path, "r") as zf:
        # Get the skill name from the package
        skill_name = package_path.stem
        skill_dir = output_dir / skill_name
        skill_dir.mkdir(parents=True, exist_ok=True)
        safe_extract_zip(zf, skill_dir)
    print(f"Extracted to {skill_dir}")
    return skill_dir


def copy_local_skill(source: Path, output_dir: Path) -> Path:
    """Copy a skill from local path to output directory."""
    if not source.exists():
        raise FileNotFoundError(f"Source skill not found: {source}")

    skill_name = source.name
    dest = output_dir / skill_name

    print(f"Copying skill from {source} to {dest}...")
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(source, dest)
    print(f"Copied to {dest}")
    return dest


def pull_from_github(url: str, output_dir: Path) -> Path:
    """Pull a skill from a GitHub repository URL."""
    # Parse GitHub URL to extract owner, repo, branch, and path
    # Format: https://github.com/owner/repo/tree/branch/path/to/skill
    parsed = urlparse(url)
    path_parts = parsed.path.strip("/").split("/")

    if len(path_parts) < 4:
        raise ValueError(f"Invalid GitHub URL format: {url}")

    owner = path_parts[0]
    repo = path_parts[1]
    # path_parts[2] should be 'tree'
    branch = path_parts[3]
    skill_path = "/".join(path_parts[4:])
    skill_name = path_parts[-1]

    # Construct the raw download URL for the zip archive
    zip_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.zip"

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        zip_path = tmp_path / "repo.zip"

        # Download the repository archive
        print(f"Downloading repository archive from {zip_url}...")
        download_file(zip_url, zip_path)

        # Extract the archive
        extract_dir = tmp_path / "extracted"
        extract_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zip_path, "r") as zf:
            safe_extract_zip(zf, extract_dir)

        # Find the skill directory within the extracted content
        repo_dir = extract_dir / f"{repo}-{branch}"
        skill_source = repo_dir / skill_path

        if not skill_source.exists():
            raise FileNotFoundError(f"Skill not found at path: {skill_path}")

        # Copy to output directory
        return copy_local_skill(skill_source, output_dir)


def pull_skill(source: str, output_dir: Path) -> Path:
    """Pull a skill from the specified source to the output directory."""
    output_dir.mkdir(parents=True, exist_ok=True)

    # Determine source type and pull accordingly
    if is_github_url(source):
        return pull_from_github(source, output_dir)
    elif source.startswith("http://") or source.startswith("https://"):
        # Remote URL - download and extract if it's a .skill package
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            if is_skill_package(source):
                package_path = tmp_path / "skill.skill"
                download_file(source, package_path)
                return extract_skill_package(package_path, output_dir)
            else:
                raise ValueError(f"Unsupported remote source: {source}")
    else:
        # Local path
        source_path = Path(source)
        if is_skill_package(source):
            return extract_skill_package(source_path, output_dir)
        else:
            return copy_local_skill(source_path, output_dir)


def main():
    parser = argparse.ArgumentParser(
        description="Pull custom skill files from remote sources.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python pull-skill.py https://github.com/owner/repo/tree/main/skills/my-skill --output skills/
  python pull-skill.py /path/to/local/skill --output skills/
  python pull-skill.py https://example.com/skill.skill --output skills/
        """,
    )
    parser.add_argument(
        "source", help="Source of the skill (GitHub URL, local path, or remote URL)"
    )
    parser.add_argument(
        "--output",
        "-o",
        required=True,
        help="Output directory for the pulled skill",
    )

    args = parser.parse_args()

    try:
        output_dir = Path(args.output)
        skill_path = pull_skill(args.source, output_dir)
        print(f"\n✅ Successfully pulled skill to: {skill_path}")
        print(f"\nNext steps:")
        print(f"  1. Validate the skill: python validate-skill.py {skill_path}")
        print(f"  2. Review {skill_path}/SKILL.md for usage instructions")
    except Exception as e:
        print(f"\n❌ Error pulling skill: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
