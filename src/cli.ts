#!/usr/bin/env node

import { spawn, spawnSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { basename, join, dirname } from 'path';
import { homedir } from 'os';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { runAdd, parseAddOptions, initTelemetry } from './add.ts';
import { runFind } from './find.ts';
import { runInstallFromLock } from './install.ts';
import { runList } from './list.ts';
import { removeCommand, parseRemoveOptions } from './remove.ts';
import { runSync, parseSyncOptions } from './sync.ts';
import { track } from './telemetry.ts';
import { fetchSkillFolderHash, getGitHubToken } from './skill-lock.ts';
import { AAX_NPX_INVOCATION } from './constants.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

const VERSION = getVersion();
initTelemetry(VERSION);

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
// 256-color grays - visible on both light and dark backgrounds
const DIM = '\x1b[38;5;102m'; // darker gray for secondary text
const TEXT = '\x1b[38;5;145m'; // lighter gray for primary text

const LOGO_LINES = [
  ' █████╗  █████╗ ██╗  ██╗',
  '██╔══██╗██╔══██╗╚██╗██╔╝',
  '███████║███████║ ╚███╔╝ ',
  '██╔══██║██╔══██║ ██╔██╗ ',
  '██║  ██║██║  ██║██╔╝ ██╗',
  '╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝',
];

// 256-color middle grays - visible on both light and dark backgrounds
const GRAYS = [
  '\x1b[38;5;250m', // lighter gray
  '\x1b[38;5;248m',
  '\x1b[38;5;245m', // mid gray
  '\x1b[38;5;243m',
  '\x1b[38;5;240m',
  '\x1b[38;5;238m', // darker gray
];

function showLogo(): void {
  console.log();
  LOGO_LINES.forEach((line, i) => {
    console.log(`${GRAYS[i]}${line}${RESET}`);
  });
}

function showBanner(): void {
  showLogo();
  console.log();
  console.log(`${DIM}The open agent package manager${RESET}`);
  console.log();
  console.log(
    `  ${DIM}$${RESET} ${TEXT}${AAX_NPX_INVOCATION} add ${DIM}<package>${RESET}        ${DIM}Add a new package${RESET}`
  );
  console.log(
    `  ${DIM}$${RESET} ${TEXT}${AAX_NPX_INVOCATION} remove${RESET}               ${DIM}Remove installed packages${RESET}`
  );
  console.log(
    `  ${DIM}$${RESET} ${TEXT}${AAX_NPX_INVOCATION} list${RESET}                 ${DIM}List installed packages${RESET}`
  );
  console.log(
    `  ${DIM}$${RESET} ${TEXT}${AAX_NPX_INVOCATION} find ${DIM}[query]${RESET}         ${DIM}Search for packages${RESET}`
  );
  console.log();
  console.log(
    `  ${DIM}$${RESET} ${TEXT}${AAX_NPX_INVOCATION} check${RESET}                ${DIM}Check for updates${RESET}`
  );
  console.log(
    `  ${DIM}$${RESET} ${TEXT}${AAX_NPX_INVOCATION} update${RESET}               ${DIM}Update all packages${RESET}`
  );
  console.log();
  console.log(
    `  ${DIM}$${RESET} ${TEXT}${AAX_NPX_INVOCATION} experimental_install${RESET} ${DIM}Restore from lock file${RESET}`
  );
  console.log(
    `  ${DIM}$${RESET} ${TEXT}${AAX_NPX_INVOCATION} init ${DIM}[name]${RESET}          ${DIM}Create a new package${RESET}`
  );
  console.log(
    `  ${DIM}$${RESET} ${TEXT}${AAX_NPX_INVOCATION} experimental_sync${RESET}    ${DIM}Sync packages from node_modules${RESET}`
  );
  console.log();
  console.log(`${DIM}try:${RESET} ${AAX_NPX_INVOCATION} add vercel-labs/agent-skills`);
  console.log();
  console.log(`Discover more packages at ${TEXT}https://aax.sh/${RESET}`);
  console.log();
}

function showHelp(): void {
  console.log(`
${BOLD}Usage:${RESET} aax <command> <resource-type> [arguments] [options]

${BOLD}Resource Types:${RESET}
  skill            Agent skills (currently supported)
  subagent         Agent definitions for specific CLIs (aliases: agent)
  mcp              MCP servers (planned)
  instruction      Instructions/rules (planned)
  hook             Hooks (planned)

${BOLD}Manage Resources:${RESET}
  add <type> <source> [names...]    Add a resource
  remove <type> [names...]          Remove installed resources
  list <type>                       List installed resources
  find [query]                      Search for resources interactively

${BOLD}Updates:${RESET}
  check                     Check for available updates
  update                    Update all resources to latest versions

${BOLD}Project:${RESET}
  experimental_install      Restore resources from lock file
  init [name]               Initialize a resource (creates <name>/SKILL.md or ./SKILL.md)
  experimental_sync         Sync resources from node_modules into agent directories

${BOLD}Global Options:${RESET}
  -g, --global              Operate at user-level instead of project-level
  -a, --agent <agents>      Specify agents to target (use '*' for all agents)
  -y, --yes                 Skip confirmation prompts
  --copy                    Copy files instead of symlinking
  --help, -h                Show help message
  --version, -v             Show version number

${BOLD}Examples:${RESET}
  ${DIM}# Add a skill${RESET}
  ${DIM}$${RESET} aax add skill vercel-labs/agent-skills
  ${DIM}$${RESET} aax add skill vercel-labs/agent-skills pr-review commit
  ${DIM}$${RESET} aax add skill vercel-labs/agent-skills -g
  ${DIM}$${RESET} aax add skill vercel-labs/agent-skills --agent claude-code cursor
  ${DIM}$${RESET} aax add skill vercel-labs/agent-skills --skill pr-review commit

  ${DIM}# Install subagents (agent definitions)${RESET}
  ${DIM}$${RESET} aax add subagent owner/repo --list      ${DIM}# show available CLI frontmatters${RESET}
  ${DIM}$${RESET} aax add subagent owner/repo --agent claude-code
  ${DIM}$${RESET} aax add subagent ./agents --global      ${DIM}# install from local folder${RESET}

  ${DIM}# Remove skills${RESET}
  ${DIM}$${RESET} aax remove skill                   ${DIM}# interactive${RESET}
  ${DIM}$${RESET} aax remove skill web-design        ${DIM}# by name${RESET}
  ${DIM}$${RESET} aax remove skill frontend-design --global

  ${DIM}# List resources${RESET}
  ${DIM}$${RESET} aax list skill                     ${DIM}# list project skills${RESET}
  ${DIM}$${RESET} aax list skill -g                  ${DIM}# list global skills${RESET}
  ${DIM}$${RESET} aax list skill -a claude-code      ${DIM}# filter by agent${RESET}

  ${DIM}# Search and manage${RESET}
  ${DIM}$${RESET} aax find                           ${DIM}# interactive search${RESET}
  ${DIM}$${RESET} aax find typescript                ${DIM}# search by keyword${RESET}
  ${DIM}$${RESET} aax check
  ${DIM}$${RESET} aax update

  ${DIM}# Project setup${RESET}
  ${DIM}$${RESET} aax experimental_install           ${DIM}# restore from lock file${RESET}
  ${DIM}$${RESET} aax init my-skill
  ${DIM}$${RESET} aax experimental_sync              ${DIM}# sync from node_modules${RESET}

Discover more at ${TEXT}https://aax.sh/${RESET}
`);
}

function showRemoveHelp(): void {
  console.log(`
${BOLD}Usage:${RESET} aax remove <resource-type> [names...] [options]

${BOLD}Description:${RESET}
  Remove installed resources from agents. If no names are provided,
  an interactive selection menu will be shown.

${BOLD}Resource Types:${RESET}
  skill            Agent skills
  mcp              MCP servers (planned)
  instruction      Instructions (planned)
  hook             Hooks (planned)

${BOLD}Arguments:${RESET}
  names             Optional resource names to remove (space-separated)

${BOLD}Options:${RESET}
  -g, --global      Remove from global scope (~/) instead of project scope
  -a, --agent       Remove from specific agents (use '*' for all agents)
  -y, --yes         Skip confirmation prompts
  --all             Remove all resources

${BOLD}Examples:${RESET}
  ${DIM}$${RESET} aax remove skill                      ${DIM}# interactive selection${RESET}
  ${DIM}$${RESET} aax remove skill my-skill             ${DIM}# remove specific skill${RESET}
  ${DIM}$${RESET} aax remove skill skill1 skill2 -y     ${DIM}# remove multiple skills${RESET}
  ${DIM}$${RESET} aax remove skill my-skill --global    ${DIM}# remove from global scope${RESET}
  ${DIM}$${RESET} aax rm skill my-skill --agent claude-code ${DIM}# remove from specific agent${RESET}
  ${DIM}$${RESET} aax remove skill --all                ${DIM}# remove all skills${RESET}
  ${DIM}$${RESET} aax remove --skill '*' -a cursor     ${DIM}# remove all packages from cursor${RESET}

Discover more packages at ${TEXT}https://aax.sh/${RESET}
`);
}

function runInit(args: string[]): void {
  const cwd = process.cwd();
  const skillName = args[0] || basename(cwd);
  const hasName = args[0] !== undefined;

  const skillDir = hasName ? join(cwd, skillName) : cwd;
  const skillFile = join(skillDir, 'SKILL.md');
  const displayPath = hasName ? `${skillName}/SKILL.md` : 'SKILL.md';

  if (existsSync(skillFile)) {
    console.log(`${TEXT}Skill already exists at ${DIM}${displayPath}${RESET}`);
    return;
  }

  if (hasName) {
    mkdirSync(skillDir, { recursive: true });
  }

  const skillContent = `---
name: ${skillName}
description: A brief description of what this skill does
---

# ${skillName}

Instructions for the agent to follow when this skill is activated.

## When to use

Describe when this skill should be used.

## Instructions

1. First step
2. Second step
3. Additional steps as needed
`;

  writeFileSync(skillFile, skillContent);

  console.log(`${TEXT}Initialized skill: ${DIM}${skillName}${RESET}`);
  console.log();
  console.log(`${DIM}Created:${RESET}`);
  console.log(`  ${displayPath}`);
  console.log();
  console.log(`${DIM}Next steps:${RESET}`);
  console.log(`  1. Edit ${TEXT}${displayPath}${RESET} to define your skill instructions`);
  console.log(
    `  2. Update the ${TEXT}name${RESET} and ${TEXT}description${RESET} in the frontmatter`
  );
  console.log();
  console.log(`${DIM}Publishing:${RESET}`);
  console.log(
    `  ${DIM}GitHub:${RESET}  Push to a repo, then ${TEXT}${AAX_NPX_INVOCATION} add <owner>/<repo>${RESET}`
  );
  console.log(
    `  ${DIM}URL:${RESET}     Host the file, then ${TEXT}${AAX_NPX_INVOCATION} add https://example.com/${displayPath}${RESET}`
  );
  console.log();
  console.log(`Browse existing skills for inspiration at ${TEXT}https://aax.sh/${RESET}`);
  console.log();
}

// ============================================
// Check and Update Commands
// ============================================

const AGENTS_DIR = '.agents';
const LOCK_FILE = '.skill-lock.json';
const CHECK_UPDATES_API_URL = 'https://add-skill.vercel.sh/check-updates';
const CURRENT_LOCK_VERSION = 3; // Bumped from 2 to 3 for folder hash support

interface SkillLockEntry {
  source: string;
  sourceType: string;
  sourceUrl: string;
  skillPath?: string;
  /** GitHub tree SHA for the entire skill folder (v3) */
  skillFolderHash: string;
  installedAt: string;
  updatedAt: string;
}

interface SkillLockFile {
  version: number;
  skills: Record<string, SkillLockEntry>;
}

interface CheckUpdatesRequest {
  skills: Array<{
    name: string;
    source: string;
    path?: string;
    skillFolderHash: string;
  }>;
}

interface CheckUpdatesResponse {
  updates: Array<{
    name: string;
    source: string;
    currentHash: string;
    latestHash: string;
  }>;
  errors?: Array<{
    name: string;
    source: string;
    error: string;
  }>;
}

function getSkillLockPath(): string {
  return join(homedir(), AGENTS_DIR, LOCK_FILE);
}

function readSkillLock(): SkillLockFile {
  const lockPath = getSkillLockPath();
  try {
    const content = readFileSync(lockPath, 'utf-8');
    const parsed = JSON.parse(content) as SkillLockFile;
    if (typeof parsed.version !== 'number' || !parsed.skills) {
      return { version: CURRENT_LOCK_VERSION, skills: {} };
    }
    // If old version, wipe and start fresh (backwards incompatible change)
    // v3 adds skillFolderHash - we want fresh installs to populate it
    if (parsed.version < CURRENT_LOCK_VERSION) {
      return { version: CURRENT_LOCK_VERSION, skills: {} };
    }
    return parsed;
  } catch {
    return { version: CURRENT_LOCK_VERSION, skills: {} };
  }
}

function writeSkillLock(lock: SkillLockFile): void {
  const lockPath = getSkillLockPath();
  const dir = join(homedir(), AGENTS_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(lockPath, JSON.stringify(lock, null, 2), 'utf-8');
}

async function runCheck(args: string[] = []): Promise<void> {
  console.log(`${TEXT}Checking for skill updates...${RESET}`);
  console.log();

  const lock = readSkillLock();
  const skillNames = Object.keys(lock.skills);

  if (skillNames.length === 0) {
    console.log(`${DIM}No skills tracked in lock file.${RESET}`);
    console.log(
      `${DIM}Install skills with${RESET} ${TEXT}${AAX_NPX_INVOCATION} add <package>${RESET}`
    );
    return;
  }

  // Get GitHub token from user's environment for higher rate limits
  const token = getGitHubToken();

  // Group skills by source (owner/repo) to batch GitHub API calls
  const skillsBySource = new Map<string, Array<{ name: string; entry: SkillLockEntry }>>();
  let skippedCount = 0;

  for (const skillName of skillNames) {
    const entry = lock.skills[skillName];
    if (!entry) continue;

    // Only check GitHub-sourced skills with folder hash
    if (entry.sourceType !== 'github' || !entry.skillFolderHash || !entry.skillPath) {
      skippedCount++;
      continue;
    }

    const existing = skillsBySource.get(entry.source) || [];
    existing.push({ name: skillName, entry });
    skillsBySource.set(entry.source, existing);
  }

  const totalSkills = skillNames.length - skippedCount;
  if (totalSkills === 0) {
    console.log(`${DIM}No GitHub skills to check.${RESET}`);
    return;
  }

  console.log(`${DIM}Checking ${totalSkills} skill(s) for updates...${RESET}`);

  const updates: Array<{ name: string; source: string }> = [];
  const errors: Array<{ name: string; source: string; error: string }> = [];

  // Check each source (one API call per repo)
  for (const [source, skills] of skillsBySource) {
    for (const { name, entry } of skills) {
      try {
        const latestHash = await fetchSkillFolderHash(source, entry.skillPath!, token);

        if (!latestHash) {
          errors.push({ name, source, error: 'Could not fetch from GitHub' });
          continue;
        }

        if (latestHash !== entry.skillFolderHash) {
          updates.push({ name, source });
        }
      } catch (err) {
        errors.push({
          name,
          source,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  }

  console.log();

  if (updates.length === 0) {
    console.log(`${TEXT}✓ All skills are up to date${RESET}`);
  } else {
    console.log(`${TEXT}${updates.length} update(s) available:${RESET}`);
    console.log();
    for (const update of updates) {
      console.log(`  ${TEXT}↑${RESET} ${update.name}`);
      console.log(`    ${DIM}source: ${update.source}${RESET}`);
    }
    console.log();
    console.log(
      `${DIM}Run${RESET} ${TEXT}${AAX_NPX_INVOCATION} update${RESET} ${DIM}to update all skills${RESET}`
    );
  }

  if (errors.length > 0) {
    console.log();
    console.log(`${DIM}Could not check ${errors.length} skill(s) (may need reinstall)${RESET}`);
  }

  // Track telemetry
  track({
    event: 'check',
    skillCount: String(totalSkills),
    updatesAvailable: String(updates.length),
  });

  console.log();
}

async function runUpdate(): Promise<void> {
  console.log(`${TEXT}Checking for skill updates...${RESET}`);
  console.log();

  const lock = readSkillLock();
  const skillNames = Object.keys(lock.skills);

  if (skillNames.length === 0) {
    console.log(`${DIM}No skills tracked in lock file.${RESET}`);
    console.log(
      `${DIM}Install skills with${RESET} ${TEXT}${AAX_NPX_INVOCATION} add <package>${RESET}`
    );
    return;
  }

  // Get GitHub token from user's environment for higher rate limits
  const token = getGitHubToken();

  // Find skills that need updates by checking GitHub directly
  const updates: Array<{ name: string; source: string; entry: SkillLockEntry }> = [];
  let checkedCount = 0;

  for (const skillName of skillNames) {
    const entry = lock.skills[skillName];
    if (!entry) continue;

    // Only check GitHub-sourced skills with folder hash
    if (entry.sourceType !== 'github' || !entry.skillFolderHash || !entry.skillPath) {
      continue;
    }

    checkedCount++;

    try {
      const latestHash = await fetchSkillFolderHash(entry.source, entry.skillPath, token);

      if (latestHash && latestHash !== entry.skillFolderHash) {
        updates.push({ name: skillName, source: entry.source, entry });
      }
    } catch {
      // Skip skills that fail to check
    }
  }

  if (checkedCount === 0) {
    console.log(`${DIM}No skills to check.${RESET}`);
    return;
  }

  if (updates.length === 0) {
    console.log(`${TEXT}✓ All skills are up to date${RESET}`);
    console.log();
    return;
  }

  console.log(`${TEXT}Found ${updates.length} update(s)${RESET}`);
  console.log();

  // Reinstall each skill that has an update
  let successCount = 0;
  let failCount = 0;

  for (const update of updates) {
    console.log(`${TEXT}Updating ${update.name}...${RESET}`);

    // Build the URL with subpath to target the specific skill directory
    // e.g., https://github.com/owner/repo/tree/main/skills/my-skill
    let installUrl = update.entry.sourceUrl;
    if (update.entry.skillPath) {
      // Extract the skill folder path (remove /SKILL.md suffix)
      let skillFolder = update.entry.skillPath;
      if (skillFolder.endsWith('/SKILL.md')) {
        skillFolder = skillFolder.slice(0, -9);
      } else if (skillFolder.endsWith('SKILL.md')) {
        skillFolder = skillFolder.slice(0, -8);
      }
      if (skillFolder.endsWith('/')) {
        skillFolder = skillFolder.slice(0, -1);
      }

      // Convert git URL to tree URL with path
      // https://github.com/owner/repo.git -> https://github.com/owner/repo/tree/main/path
      installUrl = update.entry.sourceUrl.replace(/\.git$/, '').replace(/\/$/, '');
      installUrl = `${installUrl}/tree/main/${skillFolder}`;
    }

    // Use skills CLI to reinstall with -g -y flags
    const result = spawnSync('npx', ['-y', 'skills', 'add', installUrl, '-g', '-y'], {
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    if (result.status === 0) {
      successCount++;
      console.log(`  ${TEXT}✓${RESET} Updated ${update.name}`);
    } else {
      failCount++;
      console.log(`  ${DIM}✗ Failed to update ${update.name}${RESET}`);
    }
  }

  console.log();
  if (successCount > 0) {
    console.log(`${TEXT}✓ Updated ${successCount} skill(s)${RESET}`);
  }
  if (failCount > 0) {
    console.log(`${DIM}Failed to update ${failCount} skill(s)${RESET}`);
  }

  // Track telemetry
  track({
    event: 'update',
    skillCount: String(updates.length),
    successCount: String(successCount),
    failCount: String(failCount),
  });

  console.log();
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showBanner();
    return;
  }

  const command = args[0];
  const restArgs = args.slice(1);

  switch (command) {
    case 'find':
    case 'search':
    case 'f':
    case 's':
      showLogo();
      console.log();
      await runFind(restArgs);
      break;
    case 'init':
      showLogo();
      console.log();
      runInit(restArgs);
      break;
    case 'experimental_install': {
      showLogo();
      await runInstallFromLock(restArgs);
      break;
    }
    case 'add': {
      // New subcommand structure: aax add <resource-type> <source>
      // Example: aax add skill vercel-labs/agent-skills
      showLogo();
      const resourceType = restArgs[0]; // e.g., 'skill'
      const addArgs = restArgs.slice(1); // remaining args after resource type
      const { source: addSource, options: addOpts } = parseAddOptions(addArgs);
      // Pass resource type to runAdd
      await runAdd(addSource, { ...addOpts, _resourceType: resourceType });
      break;
    }
    case 'remove':
    case 'rm': {
      // New subcommand structure: aax remove <resource-type> <name>
      // Example: aax remove skill my-skill
      // Check for --help or -h flag
      if (restArgs.includes('--help') || restArgs.includes('-h')) {
        showRemoveHelp();
        break;
      }
      const resourceType = restArgs[0]; // e.g., 'skill'
      const removeArgs = restArgs.slice(1); // remaining args after resource type
      const { skills, options: removeOptions } = parseRemoveOptions(removeArgs);
      await removeCommand(skills, { ...removeOptions, _resourceType: resourceType });
      break;
    }
    case 'experimental_sync': {
      showLogo();
      const { options: syncOptions } = parseSyncOptions(restArgs);
      await runSync(restArgs, syncOptions);
      break;
    }
    case 'list':
    case 'ls': {
      // New subcommand structure: aax list <resource-type>
      // Example: aax list skill
      const resourceType = restArgs[0]; // e.g., 'skill'
      const listArgs = restArgs.slice(1); // remaining args after resource type
      await runList(listArgs, resourceType);
      break;
    }
    case 'check':
      runCheck(restArgs);
      break;
    case 'update':
    case 'upgrade':
      runUpdate();
      break;
    case '--help':
    case '-h':
      showHelp();
      break;
    case '--version':
    case '-v':
      console.log(VERSION);
      break;

    default:
      console.log(`Unknown command: ${command}`);
      console.log(`Run ${BOLD}aax --help${RESET} for usage.`);
  }
}

main();
