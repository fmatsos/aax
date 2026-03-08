import { readdir, readFile, stat } from 'fs/promises';
import { join, basename, dirname, resolve, extname } from 'path';
import matter from 'gray-matter';
import type { Agent, AgentFrontmatter } from './types.ts';

const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '__pycache__'];

/**
 * Check if a directory has an agent markdown file.
 * Agent files can be named AGENT.md or <name>.md
 */
async function hasAgentMd(dir: string): Promise<string | null> {
  try {
    // First check for AGENT.md
    const agentPath = join(dir, 'AGENT.md');
    const stats = await stat(agentPath);
    if (stats.isFile()) {
      return agentPath;
    }
  } catch {
    // Try to find any .md file
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && extname(entry.name) === '.md' && entry.name !== 'README.md') {
          return join(dir, entry.name);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }
  return null;
}

/**
 * Parse an agent markdown file.
 * Agent files have frontmatter with name and description.
 */
export async function parseAgentMd(agentMdPath: string): Promise<Agent | null> {
  try {
    const content = await readFile(agentMdPath, 'utf-8');
    const { data, content: body } = matter(content);

    if (!data.name || !data.description) {
      return null;
    }

    // Ensure name and description are strings
    if (typeof data.name !== 'string' || typeof data.description !== 'string') {
      return null;
    }

    return {
      name: data.name,
      description: data.description,
      path: dirname(agentMdPath),
      rawContent: body,
      metadata: data,
    };
  } catch {
    return null;
  }
}

/**
 * Discover CLI-specific frontmatter files for agents.
 * These are YAML files in <cli-tool>/agents/ directories.
 * Each file is named to match an agent (e.g., claude/agents/explorer.yaml for agents/explorer.md)
 */
export async function discoverAgentFrontmatters(
  basePath: string,
  subpath?: string
): Promise<AgentFrontmatter[]> {
  const frontmatters: AgentFrontmatter[] = [];
  const searchPath = subpath ? join(basePath, subpath) : basePath;

  // Look for <cli-tool>/agents directories
  try {
    const entries = await readdir(searchPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP_DIRS.includes(entry.name)) {
        continue;
      }

      const cliToolDir = join(searchPath, entry.name);
      const agentsDir = join(cliToolDir, 'agents');

      try {
        const agentFiles = await readdir(agentsDir, { withFileTypes: true });

        for (const agentFile of agentFiles) {
          if (!agentFile.isFile() || extname(agentFile.name) !== '.yaml') {
            continue;
          }

          const frontmatterPath = join(agentsDir, agentFile.name);
          try {
            const yamlContent = await readFile(frontmatterPath, 'utf-8');
            // Use gray-matter to parse YAML
            const parsed = matter(`---\n${yamlContent}\n---`);
            const frontmatterData = parsed.data as Record<string, unknown>;

            // Extract agent name from filename (remove .yaml extension)
            const agentName = basename(agentFile.name, '.yaml');

            frontmatters.push({
              cliTool: entry.name,
              agentName,
              path: frontmatterPath,
              frontmatter: frontmatterData || {},
            });
          } catch {
            // Invalid YAML file, skip
          }
        }
      } catch {
        // No agents directory for this CLI tool
      }
    }
  } catch {
    // Search path doesn't exist
  }

  return frontmatters;
}

/**
 * Merge agent frontmatter with CLI-specific frontmatter.
 * CLI-specific frontmatter takes precedence over base frontmatter.
 */
export function mergeAgentFrontmatter(agent: Agent, cliFrontmatter: AgentFrontmatter): Agent {
  const merged = {
    ...agent,
    metadata: {
      ...agent.metadata,
      ...cliFrontmatter.frontmatter,
    },
  };

  return merged;
}

/**
 * Discover all agents in a directory.
 * Looks in agents/ directory and common agent locations.
 */
export async function discoverAgents(basePath: string, subpath?: string): Promise<Agent[]> {
  const agents: Agent[] = [];
  const seenNames = new Set<string>();
  const searchPath = subpath ? join(basePath, subpath) : basePath;

  // Common agent locations to search
  const prioritySearchDirs = [
    join(searchPath, 'agents'),
    join(searchPath, '.agents/agents'),
    searchPath,
  ];

  for (const dir of prioritySearchDirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory() || SKIP_DIRS.includes(entry.name)) {
          continue;
        }

        const agentDir = join(dir, entry.name);
        const agentMdPath = await hasAgentMd(agentDir);

        if (agentMdPath) {
          const agent = await parseAgentMd(agentMdPath);
          if (agent && !seenNames.has(agent.name)) {
            agents.push(agent);
            seenNames.add(agent.name);
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  return agents;
}

/**
 * Get available CLI tools that have frontmatter for a specific agent.
 */
export function getAvailableCliTools(
  agentName: string,
  frontmatters: AgentFrontmatter[]
): string[] {
  return frontmatters
    .filter((fm) => fm.agentName === agentName)
    .map((fm) => fm.cliTool)
    .sort();
}

/**
 * Group agents by available CLI tools.
 * Returns a map of CLI tool name to agent names.
 */
export function groupAgentsByCliTool(
  agents: Agent[],
  frontmatters: AgentFrontmatter[]
): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const frontmatter of frontmatters) {
    if (!groups.has(frontmatter.cliTool)) {
      groups.set(frontmatter.cliTool, []);
    }

    // Only add if the agent exists
    if (agents.some((a) => a.name === frontmatter.agentName)) {
      const agentList = groups.get(frontmatter.cliTool)!;
      if (!agentList.includes(frontmatter.agentName)) {
        agentList.push(frontmatter.agentName);
      }
    }
  }

  return groups;
}

/**
 * Generate the final agent content by merging frontmatter with markdown.
 */
export function generateAgentContent(agent: Agent, frontmatter?: AgentFrontmatter): string {
  const finalMetadata = frontmatter
    ? { ...agent.metadata, ...frontmatter.frontmatter }
    : agent.metadata;

  // Use gray-matter to stringify the frontmatter
  const result = matter.stringify(agent.rawContent || '', finalMetadata);

  return result;
}
