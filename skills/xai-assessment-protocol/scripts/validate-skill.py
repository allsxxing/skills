#!/usr/bin/env python3
"""
Validate a skill's structure and content.

Usage:
    python validate-skill.py <skill-path>

Examples:
    python validate-skill.py skills/my-skill
    python validate-skill.py /path/to/skill
"""

import argparse
import re
import sys
from pathlib import Path


def validate_skill_name(name: str) -> list[str]:
    """Validate skill name follows conventions."""
    errors = []

    if not name:
        errors.append("Skill name is empty")
        return errors

    if not re.match(r"^[a-z0-9-]+$", name):
        errors.append(
            f"Skill name '{name}' must contain only lowercase letters, digits, and hyphens"
        )

    if len(name) > 40:
        errors.append(f"Skill name '{name}' exceeds 40 character limit")

    if name.startswith("-") or name.endswith("-"):
        errors.append(f"Skill name '{name}' cannot start or end with a hyphen")

    return errors


def validate_frontmatter(content: str) -> tuple[dict, list[str]]:
    """Validate YAML frontmatter and extract metadata."""
    errors = []
    metadata = {}

    # Check for frontmatter markers
    if not content.startswith("---"):
        errors.append("SKILL.md must start with YAML frontmatter (---)")
        return metadata, errors

    # Find the closing marker
    end_marker = content.find("---", 3)
    if end_marker == -1:
        errors.append("SKILL.md frontmatter is missing closing (---)")
        return metadata, errors

    frontmatter = content[3:end_marker].strip()

    # Parse simple YAML (name and description)
    for line in frontmatter.split("\n"):
        if ":" in line:
            key, value = line.split(":", 1)
            key = key.strip()
            value = value.strip()
            metadata[key] = value

    # Validate required fields
    if "name" not in metadata:
        errors.append("Frontmatter missing required field: name")
    elif not metadata["name"]:
        errors.append("Frontmatter 'name' field is empty")

    if "description" not in metadata:
        errors.append("Frontmatter missing required field: description")
    elif not metadata["description"]:
        errors.append("Frontmatter 'description' field is empty")
    elif metadata["description"].startswith("[TODO"):
        errors.append("Frontmatter 'description' contains TODO placeholder")

    return metadata, errors


def validate_body(content: str) -> list[str]:
    """Validate SKILL.md body content."""
    errors = []

    # Find body content (after frontmatter)
    if content.startswith("---"):
        end_marker = content.find("---", 3)
        if end_marker != -1:
            body = content[end_marker + 3 :].strip()
        else:
            body = ""
    else:
        body = content

    if not body:
        errors.append("SKILL.md body is empty")
        return errors

    # Check for TODO placeholders
    if "[TODO" in body:
        errors.append("SKILL.md body contains TODO placeholders")

    # Check for minimum content
    if len(body) < 100:
        errors.append("SKILL.md body content seems too short (< 100 characters)")

    return errors


def validate_directory_structure(skill_path: Path) -> list[str]:
    """Validate skill directory structure."""
    errors = []

    # Check SKILL.md exists
    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        errors.append("Missing required file: SKILL.md")

    # Validate optional directories
    for dirname in ["scripts", "references", "assets"]:
        dir_path = skill_path / dirname
        if dir_path.exists() and not dir_path.is_dir():
            errors.append(f"'{dirname}' exists but is not a directory")

    return errors


def validate_skill(skill_path: Path) -> tuple[bool, list[str], list[str]]:
    """Validate a complete skill and return (success, errors, warnings)."""
    errors = []
    warnings = []

    # Validate directory exists
    if not skill_path.exists():
        return False, [f"Skill path does not exist: {skill_path}"], []

    if not skill_path.is_dir():
        return False, [f"Skill path is not a directory: {skill_path}"], []

    # Validate directory structure
    errors.extend(validate_directory_structure(skill_path))

    # Validate skill name matches directory
    skill_name = skill_path.name
    name_errors = validate_skill_name(skill_name)
    errors.extend(name_errors)

    # Validate SKILL.md content
    skill_md = skill_path / "SKILL.md"
    if skill_md.exists():
        content = skill_md.read_text()

        # Validate frontmatter
        metadata, fm_errors = validate_frontmatter(content)
        errors.extend(fm_errors)

        # Check name matches directory
        if "name" in metadata and metadata["name"] != skill_name:
            errors.append(
                f"Frontmatter name '{metadata['name']}' does not match directory name '{skill_name}'"
            )

        # Validate body
        body_errors = validate_body(content)
        errors.extend(body_errors)

    # Check for empty resource directories (warnings)
    for dirname in ["scripts", "references", "assets"]:
        dir_path = skill_path / dirname
        if dir_path.exists() and dir_path.is_dir():
            files = list(dir_path.iterdir())
            if not files:
                warnings.append(f"'{dirname}/' directory is empty")

    return len(errors) == 0, errors, warnings


def main():
    parser = argparse.ArgumentParser(
        description="Validate a skill's structure and content.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python validate-skill.py skills/my-skill
  python validate-skill.py /path/to/skill
        """,
    )
    parser.add_argument("skill_path", help="Path to the skill directory")

    args = parser.parse_args()
    skill_path = Path(args.skill_path)

    print(f"🔍 Validating skill: {skill_path}")
    print("")

    success, errors, warnings = validate_skill(skill_path)

    if warnings:
        print("⚠️  Warnings:")
        for warning in warnings:
            print(f"   - {warning}")
        print("")

    if errors:
        print("❌ Errors:")
        for error in errors:
            print(f"   - {error}")
        print("")
        print("❌ Validation failed")
        sys.exit(1)
    else:
        print("✅ Validation passed")
        sys.exit(0)


if __name__ == "__main__":
    main()
