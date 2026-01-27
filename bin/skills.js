#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

const VERSION = '1.0.0';
const SKILLS_DIR = path.join(os.homedir(), '.agent-skills');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function showHelp() {
  console.log(`
${colors.bright}agent-skills${colors.reset} - CLI for installing Agent Skills from GitHub repositories

${colors.bright}USAGE${colors.reset}
  npx agent-skills <command> [options]
  skills <command> [options]

${colors.bright}COMMANDS${colors.reset}
  add <owner/repo>     Install skills from a GitHub repository
  list                 List installed skills
  remove <name>        Remove an installed skill
  info <name>          Show information about a skill
  update [name]        Update installed skills (or a specific skill)

${colors.bright}OPTIONS${colors.reset}
  -h, --help           Show this help message
  -v, --version        Show version number
  -d, --dir <path>     Custom installation directory (default: ~/.agent-skills)
  -b, --branch <name>  Specify branch to clone (default: main)
  --force              Force reinstall even if skill exists

${colors.bright}EXAMPLES${colors.reset}
  npx agent-skills add anthropics/skills
  npx agent-skills add owner/repo --branch develop
  npx agent-skills list
  npx agent-skills remove my-skill
  npx agent-skills info my-skill

${colors.bright}SKILL STRUCTURE${colors.reset}
  Skills are installed to ~/.agent-skills/<repo-name>/
  Each skill should contain a SKILL.md file with:
    - YAML frontmatter (name, description, version)
    - Markdown instructions

${colors.bright}MORE INFO${colors.reset}
  Specification: https://agentskills.io/specification
  GitHub: https://github.com/anthropics/skills
`);
}

function showVersion() {
  console.log(`agent-skills v${VERSION}`);
}

function ensureSkillsDir(customDir = null) {
  const dir = customDir || SKILLS_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logInfo(`Created skills directory: ${dir}`);
  }
  return dir;
}

function parseOwnerRepo(input) {
  // Handle full GitHub URLs
  let ownerRepo = input;

  if (input.includes('github.com')) {
    const match = input.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (match) {
      ownerRepo = `${match[1]}/${match[2]}`;
    }
  }

  const parts = ownerRepo.split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid repository format: "${input}". Expected "owner/repo" or GitHub URL.`);
  }

  return {
    owner: parts[0],
    repo: parts[1].replace(/\.git$/, ''),
    full: `${parts[0]}/${parts[1].replace(/\.git$/, '')}`,
  };
}

function checkGitInstalled() {
  try {
    execSync('git --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function cloneRepo(ownerRepo, targetDir, branch = 'main', force = false) {
  const { owner, repo, full } = parseOwnerRepo(ownerRepo);
  const repoDir = path.join(targetDir, repo);
  const repoUrl = `https://github.com/${full}.git`;

  // Check if already exists
  if (fs.existsSync(repoDir)) {
    if (force) {
      logWarning(`Removing existing installation: ${repoDir}`);
      fs.rmSync(repoDir, { recursive: true, force: true });
    } else {
      throw new Error(`Skill already installed at ${repoDir}. Use --force to reinstall.`);
    }
  }

  logInfo(`Cloning ${full} (branch: ${branch})...`);

  try {
    execSync(`git clone --depth 1 --branch ${branch} ${repoUrl} "${repoDir}"`, {
      stdio: 'pipe',
    });
  } catch (error) {
    // Try without branch specification (for default branch)
    try {
      execSync(`git clone --depth 1 ${repoUrl} "${repoDir}"`, {
        stdio: 'pipe',
      });
    } catch (cloneError) {
      throw new Error(`Failed to clone repository: ${full}. Make sure the repository exists and is accessible.`);
    }
  }

  return { repoDir, repo, owner, full };
}

function findSkills(repoDir) {
  const skills = [];

  // Check if root has SKILL.md
  const rootSkill = path.join(repoDir, 'SKILL.md');
  if (fs.existsSync(rootSkill)) {
    skills.push({ name: path.basename(repoDir), path: repoDir, skillFile: rootSkill });
  }

  // Check skills/ subdirectory
  const skillsSubdir = path.join(repoDir, 'skills');
  if (fs.existsSync(skillsSubdir) && fs.statSync(skillsSubdir).isDirectory()) {
    const entries = fs.readdirSync(skillsSubdir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFile = path.join(skillsSubdir, entry.name, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          skills.push({
            name: entry.name,
            path: path.join(skillsSubdir, entry.name),
            skillFile,
          });
        }
      }
    }
  }

  return skills;
}

function parseSkillMd(skillFile) {
  const content = fs.readFileSync(skillFile, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return { name: 'Unknown', description: 'No description', version: '0.0.0' };
  }

  const frontmatter = frontmatterMatch[1];
  const info = {};

  // Parse YAML frontmatter (simple parser)
  const lines = frontmatter.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      info[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }

  return {
    name: info.name || 'Unknown',
    description: info.description || 'No description',
    version: info.version || '1.0.0',
    ...info,
  };
}

async function addSkill(ownerRepo, options = {}) {
  const { dir, branch = 'main', force = false } = options;

  if (!checkGitInstalled()) {
    throw new Error('Git is not installed. Please install Git to use this command.');
  }

  const targetDir = ensureSkillsDir(dir);
  const { repoDir, repo, full } = await cloneRepo(ownerRepo, targetDir, branch, force);

  // Find and list installed skills
  const skills = findSkills(repoDir);

  if (skills.length === 0) {
    logWarning(`No SKILL.md files found in ${full}. Repository cloned but no skills detected.`);
    logInfo(`Repository installed at: ${repoDir}`);
    return;
  }

  logSuccess(`Successfully installed ${skills.length} skill(s) from ${full}:`);
  console.log('');

  for (const skill of skills) {
    const info = parseSkillMd(skill.skillFile);
    console.log(`  ${colors.bright}${info.name}${colors.reset}`);
    console.log(`    ${colors.cyan}${info.description}${colors.reset}`);
    console.log(`    Path: ${skill.path}`);
    console.log('');
  }

  logInfo(`Skills installed to: ${repoDir}`);
  logInfo(`Use 'skills list' to see all installed skills.`);
}

function listSkills(options = {}) {
  const { dir } = options;
  const targetDir = dir || SKILLS_DIR;

  if (!fs.existsSync(targetDir)) {
    logInfo('No skills installed yet.');
    logInfo(`Use 'npx agent-skills add <owner/repo>' to install skills.`);
    return;
  }

  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  const repos = entries.filter(e => e.isDirectory());

  if (repos.length === 0) {
    logInfo('No skills installed yet.');
    return;
  }

  let totalSkills = 0;

  console.log(`\n${colors.bright}Installed Skills${colors.reset}\n`);

  for (const repo of repos) {
    const repoDir = path.join(targetDir, repo.name);
    const skills = findSkills(repoDir);

    if (skills.length > 0) {
      console.log(`${colors.bright}${repo.name}${colors.reset} (${skills.length} skills)`);

      for (const skill of skills) {
        const info = parseSkillMd(skill.skillFile);
        console.log(`  - ${info.name}: ${colors.cyan}${info.description}${colors.reset}`);
        totalSkills++;
      }
      console.log('');
    }
  }

  logInfo(`Total: ${totalSkills} skill(s) from ${repos.length} repository(ies)`);
  logInfo(`Skills directory: ${targetDir}`);
}

function removeSkill(name, options = {}) {
  const { dir } = options;
  const targetDir = dir || SKILLS_DIR;
  const skillPath = path.join(targetDir, name);

  if (!fs.existsSync(skillPath)) {
    throw new Error(`Skill "${name}" not found at ${skillPath}`);
  }

  fs.rmSync(skillPath, { recursive: true, force: true });
  logSuccess(`Removed skill: ${name}`);
}

function showSkillInfo(name, options = {}) {
  const { dir } = options;
  const targetDir = dir || SKILLS_DIR;
  const skillPath = path.join(targetDir, name);

  if (!fs.existsSync(skillPath)) {
    throw new Error(`Skill "${name}" not found at ${skillPath}`);
  }

  const skills = findSkills(skillPath);

  if (skills.length === 0) {
    logWarning(`No SKILL.md found in ${name}`);
    return;
  }

  console.log(`\n${colors.bright}Skill Information: ${name}${colors.reset}\n`);

  for (const skill of skills) {
    const info = parseSkillMd(skill.skillFile);
    console.log(`${colors.bright}${info.name}${colors.reset}`);
    console.log(`  Description: ${info.description}`);
    console.log(`  Version: ${info.version || 'N/A'}`);
    console.log(`  Path: ${skill.path}`);

    // Show directory contents
    const contents = fs.readdirSync(skill.path);
    console.log(`  Contents: ${contents.join(', ')}`);
    console.log('');
  }
}

async function updateSkill(name, options = {}) {
  const { dir } = options;
  const targetDir = dir || SKILLS_DIR;

  if (name) {
    // Update specific skill
    const skillPath = path.join(targetDir, name);
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill "${name}" not found at ${skillPath}`);
    }

    logInfo(`Updating ${name}...`);
    try {
      execSync('git pull', { cwd: skillPath, stdio: 'pipe' });
      logSuccess(`Updated ${name}`);
    } catch (error) {
      throw new Error(`Failed to update ${name}: ${error.message}`);
    }
  } else {
    // Update all skills
    if (!fs.existsSync(targetDir)) {
      logInfo('No skills installed yet.');
      return;
    }

    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const repos = entries.filter(e => e.isDirectory());

    for (const repo of repos) {
      const repoPath = path.join(targetDir, repo.name);
      logInfo(`Updating ${repo.name}...`);
      try {
        execSync('git pull', { cwd: repoPath, stdio: 'pipe' });
        logSuccess(`Updated ${repo.name}`);
      } catch (error) {
        logError(`Failed to update ${repo.name}: ${error.message}`);
      }
    }
  }
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }

  if (args.includes('-v') || args.includes('--version')) {
    showVersion();
    return;
  }

  const command = args[0];
  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '-d' || args[i] === '--dir') {
      options.dir = args[++i];
    } else if (args[i] === '-b' || args[i] === '--branch') {
      options.branch = args[++i];
    } else if (args[i] === '--force') {
      options.force = true;
    } else if (!args[i].startsWith('-')) {
      options.target = args[i];
    }
  }

  try {
    switch (command) {
      case 'add':
        if (!options.target) {
          throw new Error('Missing repository. Usage: skills add <owner/repo>');
        }
        await addSkill(options.target, options);
        break;

      case 'list':
      case 'ls':
        listSkills(options);
        break;

      case 'remove':
      case 'rm':
        if (!options.target) {
          throw new Error('Missing skill name. Usage: skills remove <name>');
        }
        removeSkill(options.target, options);
        break;

      case 'info':
        if (!options.target) {
          throw new Error('Missing skill name. Usage: skills info <name>');
        }
        showSkillInfo(options.target, options);
        break;

      case 'update':
        await updateSkill(options.target, options);
        break;

      default:
        logError(`Unknown command: ${command}`);
        console.log('Run "skills --help" for usage information.');
        process.exit(1);
    }
  } catch (error) {
    logError(error.message);
    process.exit(1);
  }
}

main();
