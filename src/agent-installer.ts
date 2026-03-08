import { writeFile, mkdir, rm } from 'fs/promises';
import { join, basename } from 'path';
import { homedir } from 'os';
import type { Agent, AgentType, AgentFrontmatter } from './types.ts';
import { agents } from './agents.ts';
import { AGENTS_DIR, AGENTS_SUBDIR } from './constants.ts';
import { sanitizeName } from './installer.ts';
import { generateAgentContent } from './agents-resource.ts';

export type InstallMode = 'symlink' | 'copy';

interface AgentInstallResult {
  success: boolean;
  path: string;
  canonicalPath?: string;
  cliTool?: string;
  error?: string;
}

/**
 * Gets the canonical directory for agents (.agents/agents)
 */
export function getCanonicalAgentsDir(global: boolean, cwd?: string): string {
  const baseDir = global ? homedir() : cwd || process.cwd();
  return join(baseDir, AGENTS_DIR, AGENTS_SUBDIR);
}

/**
 * Gets the directory path for a CLI tool's agents
 * (e.g., .claude/agents, ~/.copilot/agents)
 */
export function getCliToolAgentsDir(cliTool: string, global: boolean, cwd?: string): string {
  const baseDir = global ? homedir() : cwd || process.cwd();

  // Map CLI tool names to their agent directories
  const cliToolDirs: Record<string, string> = {
    claude: '.claude/agents',
    'claude-code': '.claude/agents',
    copilot: '.copilot/agents',
    'github-copilot': '.copilot/agents',
    cursor: '.cursor/agents',
    cline: '.cline/agents',
    windsurf: '.windsurf/agents',
    continue: '.continue/agents',
    codebuddy: '.codebuddy/agents',
    codex: '.codex/agents',
    // Add more as needed
  };

  const relativeDir = cliToolDirs[cliTool] || `.${cliTool}/agents`;
  return join(baseDir, relativeDir);
}

/**
 * Generate agent filename with CLI tool suffix if needed.
 * Examples:
 *   - Single CLI: "explorer.md"
 *   - Multiple CLIs: "explorer.claude.md", "explorer.copilot.md"
 */
export function getAgentFilename(agentName: string, cliTools: string[]): string {
  const sanitized = sanitizeName(agentName);

  if (cliTools.length === 1) {
    return `${sanitized}.md`;
  }

  // Multiple CLI tools - we'll create separate files for each
  // The caller should call this for each CLI tool individually
  return `${sanitized}.md`;
}

/**
 * Generate agent filename with CLI suffix for multi-CLI installations
 */
export function getAgentFilenameWithSuffix(agentName: string, cliTool: string): string {
  const sanitized = sanitizeName(agentName);
  const cliSanitized = sanitizeName(cliTool);
  return `${sanitized}.${cliSanitized}.md`;
}

/**
 * Install an agent for a specific CLI tool.
 * Agents are installed to .agents/agents and symlinked to CLI tool directories.
 */
export async function installAgentForCli(
  agent: Agent,
  cliTool: string,
  cliToolFrontmatters: AgentFrontmatter[],
  options: { global?: boolean; cwd?: string; multiCli?: boolean } = {}
): Promise<AgentInstallResult> {
  const isGlobal = options.global ?? false;
  const cwd = options.cwd || process.cwd();
  const isMultiCli = options.multiCli ?? false;

  try {
    // Find frontmatter for this CLI tool
    const frontmatter = cliToolFrontmatters.find(
      (fm) => fm.cliTool === cliTool && fm.agentName === agent.name
    );

    if (!frontmatter) {
      return {
        success: false,
        path: '',
        error: `No frontmatter found for agent "${agent.name}" and CLI tool "${cliTool}"`,
      };
    }

    // Generate merged content
    const mergedContent = generateAgentContent(agent, frontmatter);

    // Canonical location: .agents/agents/<agent-name>.md or <agent-name>.<cli>.md
    const canonicalBase = getCanonicalAgentsDir(isGlobal, cwd);
    await mkdir(canonicalBase, { recursive: true });

    const filename = isMultiCli
      ? getAgentFilenameWithSuffix(agent.name, cliTool)
      : getAgentFilename(agent.name, [cliTool]);
    const canonicalPath = join(canonicalBase, filename);

    // Write to canonical location
    await writeFile(canonicalPath, mergedContent, 'utf-8');

    // Also symlink to CLI tool directory (e.g., .claude/agents)
    const cliToolDir = getCliToolAgentsDir(cliTool, isGlobal, cwd);
    await mkdir(cliToolDir, { recursive: true });
    const cliToolPath = join(cliToolDir, filename);

    // For now, just copy (symlinks can be added later if needed)
    // This ensures the agent files are available in the expected locations
    await writeFile(cliToolPath, mergedContent, 'utf-8');

    return {
      success: true,
      path: cliToolPath,
      canonicalPath,
      cliTool,
    };
  } catch (error) {
    return {
      success: false,
      path: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove an agent installation for a specific CLI tool
 */
export async function removeAgentForCli(
  agentName: string,
  cliTool: string,
  options: { global?: boolean; cwd?: string; multiCli?: boolean } = {}
): Promise<boolean> {
  const isGlobal = options.global ?? false;
  const cwd = options.cwd || process.cwd();
  const isMultiCli = options.multiCli ?? false;

  try {
    const canonicalBase = getCanonicalAgentsDir(isGlobal, cwd);
    const filename = isMultiCli
      ? getAgentFilenameWithSuffix(agentName, cliTool)
      : getAgentFilename(agentName, [cliTool]);

    const canonicalPath = join(canonicalBase, filename);
    const cliToolDir = getCliToolAgentsDir(cliTool, isGlobal, cwd);
    const cliToolPath = join(cliToolDir, filename);

    // Remove from both locations
    await Promise.all([rm(canonicalPath, { force: true }), rm(cliToolPath, { force: true })]);

    return true;
  } catch {
    return false;
  }
}
