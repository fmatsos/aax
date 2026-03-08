/**
 * Resource types that can be managed by aax.
 * Currently only 'skill' is implemented, but this is designed to support
 * future resource types like 'agent', 'mcp', 'instruction', 'hook', etc.
 */
export type ResourceType = 'skill' | 'agent' | 'mcp' | 'instruction' | 'hook';

export type AgentType =
  | 'amp'
  | 'antigravity'
  | 'augment'
  | 'claude-code'
  | 'openclaw'
  | 'cline'
  | 'codebuddy'
  | 'codex'
  | 'command-code'
  | 'continue'
  | 'cortex'
  | 'crush'
  | 'cursor'
  | 'droid'
  | 'gemini-cli'
  | 'github-copilot'
  | 'goose'
  | 'iflow-cli'
  | 'junie'
  | 'kilo'
  | 'kimi-cli'
  | 'kiro-cli'
  | 'kode'
  | 'mcpjam'
  | 'mistral-vibe'
  | 'mux'
  | 'neovate'
  | 'opencode'
  | 'openhands'
  | 'pi'
  | 'qoder'
  | 'qwen-code'
  | 'replit'
  | 'roo'
  | 'trae'
  | 'trae-cn'
  | 'windsurf'
  | 'zencoder'
  | 'pochi'
  | 'adal'
  | 'universal';

export interface Skill {
  name: string;
  description: string;
  path: string;
  /** Raw SKILL.md content for hashing */
  rawContent?: string;
  /** Name of the plugin this skill belongs to (if any) */
  pluginName?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentConfig {
  name: string;
  displayName: string;
  skillsDir: string;
  /** Global skills directory. Set to undefined if the agent doesn't support global installation. */
  globalSkillsDir: string | undefined;
  detectInstalled: () => Promise<boolean>;
  /** Whether to show this agent in the universal agents list. Defaults to true. */
  showInUniversalList?: boolean;
}

export interface ParsedSource {
  type: 'github' | 'gitlab' | 'git' | 'local' | 'well-known';
  url: string;
  subpath?: string;
  localPath?: string;
  ref?: string;
  /** Skill name extracted from @skill syntax (e.g., owner/repo@skill-name) */
  skillFilter?: string;
}

/**
 * Represents a skill fetched from a remote host provider.
 */
export interface RemoteSkill {
  /** Display name of the skill (from frontmatter) */
  name: string;
  /** Description of the skill (from frontmatter) */
  description: string;
  /** Full markdown content including frontmatter */
  content: string;
  /** The identifier used for installation directory name */
  installName: string;
  /** The original source URL */
  sourceUrl: string;
  /** The provider that fetched this skill */
  providerId: string;
  /** Source identifier (e.g., "mintlify.com") */
  sourceIdentifier: string;
  /** Any additional metadata from frontmatter */
  metadata?: Record<string, unknown>;
}

/**
 * Represents an agent definition that can be installed for CLI tools.
 * Agents are markdown files with frontmatter that define agent behaviors.
 */
export interface Agent {
  /** Agent name (from markdown file or frontmatter) */
  name: string;
  /** Agent description (from frontmatter) */
  description: string;
  /** Path to the agent markdown file */
  path: string;
  /** Raw markdown content (body without frontmatter) */
  rawContent?: string;
  /** Frontmatter metadata from the base agent file */
  metadata?: Record<string, unknown>;
}

/**
 * CLI-specific frontmatter configuration for agents.
 * These are YAML files that contain frontmatter to be merged with the base agent.
 */
export interface AgentFrontmatter {
  /** CLI tool name (e.g., 'claude', 'copilot') */
  cliTool: string;
  /** Agent name this frontmatter applies to */
  agentName: string;
  /** Path to the frontmatter YAML file */
  path: string;
  /** Frontmatter data to be merged */
  frontmatter: Record<string, unknown>;
}
