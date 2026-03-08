# Agent Resources Architecture

## Overview

Agent resources are CLI-specific configurations that customize agent behaviors for different coding agent tools (Claude Code, GitHub Copilot, Cursor, etc.). Unlike skills which are universal across all agents, agent resources are organized by CLI tool with frontmatter-based customization.

## Key Differences from Skills

| Feature | Skills | Agents |
|---------|--------|--------|
| **Universality** | Universal across all CLI tools | CLI-specific configurations |
| **Structure** | Single SKILL.md file | Base AGENT.md + CLI-specific YAML frontmatters |
| **Installation** | `.agents/skills/` | `.agents/agents/` + CLI tool directories |
| **Customization** | One size fits all | Customized per CLI tool |
| **Naming** | Single filename | Suffixed for multi-CLI (e.g., `explorer.claude.md`) |

## Repository Structure

Agent repositories are organized to support multiple CLI tools:

```
repo/
├── agents/                      # Base agent definitions
│   ├── explorer/
│   │   └── AGENT.md            # Base agent with name, description, instructions
│   ├── reviewer/
│   │   └── AGENT.md
│   └── builder/
│       └── AGENT.md
├── claude/agents/               # Claude Code-specific frontmatters
│   ├── explorer.yaml
│   ├── reviewer.yaml
│   └── builder.yaml
├── copilot/agents/              # GitHub Copilot-specific frontmatters
│   ├── explorer.yaml
│   └── reviewer.yaml
└── cursor/agents/               # Cursor-specific frontmatters
    └── explorer.yaml
```

### Agent Discovery Locations

The CLI searches for agents in these priority locations:
1. `agents/` - Primary location for base agent definitions
2. `.agents/agents/` - Alternative canonical location
3. Root directory (if contains AGENT.md)

### Frontmatter Discovery

CLI-specific frontmatter files are discovered by searching for:
- Pattern: `<cli-tool>/agents/*.yaml`
- Examples: `claude/agents/explorer.yaml`, `copilot/agents/builder.yaml`

## Agent File Format

### Base Agent (AGENT.md)

Base agents are markdown files with YAML frontmatter:

```markdown
---
name: explorer
description: Explores and analyzes code structure
version: 1.0
author: Your Name
tags:
  - exploration
  - analysis
---

# Code Explorer Agent

This agent helps explore and analyze code structure.

## Capabilities

- Discover code patterns
- Analyze dependencies
- Generate architecture diagrams

## Usage

When asked to explore code, this agent will:

1. Scan the directory structure
2. Identify key components
3. Generate a comprehensive report
```

**Required Fields:**
- `name`: Agent identifier (lowercase, hyphens allowed)
- `description`: Brief explanation of agent purpose

**Optional Fields:**
- `version`: Agent version number
- `author`: Agent creator
- `tags`: Categorization tags
- Any custom metadata

### CLI-Specific Frontmatter (YAML)

CLI tool frontmatter files customize the agent for specific tools:

**claude/agents/explorer.yaml:**
```yaml
model: claude-3-5-sonnet
temperature: 0.7
max_tokens: 4096
tools:
  - grep
  - find
  - tree
system_prompt_prefix: |
  You are an expert code explorer using Claude Code.
```

**copilot/agents/explorer.yaml:**
```yaml
model: gpt-4
temperature: 0.5
tools:
  - search
  - read_file
copilot_features:
  - workspace_analysis
  - semantic_search
```

## Frontmatter Merging

When an agent is installed, the CLI merges the base agent frontmatter with the CLI-specific frontmatter:

**Merge Priority:**
1. Base agent metadata (lowest priority)
2. CLI-specific frontmatter (highest priority)

**Example Merge:**

Base agent:
```yaml
name: explorer
description: Explores code
version: 1.0
temperature: 0.5
```

Claude frontmatter:
```yaml
model: claude-3-5-sonnet
temperature: 0.7
tools: [grep, find]
```

Final merged agent:
```yaml
name: explorer
description: Explores code
version: 1.0
temperature: 0.7  # Overridden by CLI frontmatter
model: claude-3-5-sonnet
tools: [grep, find]
```

## Installation Flow

### 1. Discovery Phase

```typescript
// Discover base agents
const agents = await discoverAgents(repoPath);
// Result: [{ name: 'explorer', description: '...', ... }]

// Discover CLI-specific frontmatters
const frontmatters = await discoverAgentFrontmatters(repoPath);
// Result: [
//   { cliTool: 'claude', agentName: 'explorer', frontmatter: {...} },
//   { cliTool: 'copilot', agentName: 'explorer', frontmatter: {...} }
// ]
```

### 2. Grouping Phase

```typescript
// Group agents by available CLI tools
const groups = groupAgentsByCliTool(agents, frontmatters);
// Result: Map {
//   'claude' => ['explorer', 'reviewer', 'builder'],
//   'copilot' => ['explorer', 'reviewer'],
//   'cursor' => ['explorer']
// }
```

### 3. Installation Phase

For each agent-CLI combination:

1. **Merge frontmatter** with base agent content
2. **Generate final markdown** with merged YAML frontmatter
3. **Write to canonical location**: `.agents/agents/<name>.<cli>.md`
4. **Copy/symlink to CLI directory**: `.claude/agents/<name>.<cli>.md`

### Installation Locations

**Canonical Location:**
```
.agents/agents/              # Project-level
~/.agents/agents/            # Global (with --global flag)
```

**CLI-Specific Locations:**
```
.claude/agents/              # Claude Code
.copilot/agents/             # GitHub Copilot
.cursor/agents/              # Cursor
.cline/agents/               # Cline
# ... etc
```

### Multi-CLI Suffix Naming

When an agent is available for multiple CLI tools, files are suffixed:

**Single CLI (no suffix):**
```
.agents/agents/explorer.md
.claude/agents/explorer.md
```

**Multiple CLIs (with suffix):**
```
.agents/agents/explorer.claude.md
.agents/agents/explorer.copilot.md
.agents/agents/explorer.cursor.md

.claude/agents/explorer.claude.md
.copilot/agents/explorer.copilot.md
.cursor/agents/explorer.cursor.md
```

## Command Interface

### Add Subagent (agent resources)

```bash
# List available agents grouped by CLI tool
aax add subagent owner/repo --list

# Install all agents for all available CLI tools
aax add subagent owner/repo

# Install globally
aax add subagent owner/repo --global

# Install with yes flag (no prompts)
aax add subagent owner/repo -y

# Install globally with yes flag
aax add subagent owner/repo -g -y

# Install only for specific CLI tools (avoids confusion with the --agent skill filter)
aax add subagent owner/repo --agent claude-code cursor
```

> The CLI command is named `subagent` to distinguish it from the `--agent` option used to target CLI tools when installing or listing skills. Internally this still maps to the `agent` resource type.

### List Agents (Coming Soon)

```bash
# List all installed agents
aax list agent

# List agents for specific CLI tools
aax list agent --agent claude-code copilot

# List global agents only
aax list agent --global
```

### Remove Agents (Coming Soon)

```bash
# Remove specific agent
aax remove agent explorer

# Remove from specific CLI tool
aax remove agent explorer --agent claude-code

# Remove globally
aax remove agent explorer --global
```

## Implementation Details

### Core Modules

**Agent Discovery** (`src/agents-resource.ts`):
- `discoverAgents()` - Find base agent markdown files
- `discoverAgentFrontmatters()` - Find CLI-specific YAML files
- `parseAgentMd()` - Parse AGENT.md frontmatter and content
- `groupAgentsByCliTool()` - Organize agents by CLI availability
- `generateAgentContent()` - Merge frontmatter and generate final content

**Agent Installation** (`src/agent-installer.ts`):
- `installAgentForCli()` - Install agent for specific CLI tool
- `getCanonicalAgentsDir()` - Get `.agents/agents` path
- `getCliToolAgentsDir()` - Get CLI-specific agent directory
- `getAgentFilename()` - Generate filename with optional suffix
- `removeAgentForCli()` - Remove agent installation

**Agent Add Command** (`src/add-agent.ts`):
- `runAddAgent()` - Main handler for the `aax add subagent` command (alias: `agent`)
- Clones/reads repository
- Discovers agents and frontmatters
- Groups by CLI tool
- Handles `--list` flag
- Installs agents with user feedback

### Type Definitions

```typescript
// Base agent type
interface Agent {
  name: string;
  description: string;
  path: string;
  rawContent?: string;
  metadata?: Record<string, unknown>;
}

// CLI-specific frontmatter type
interface AgentFrontmatter {
  cliTool: string;
  agentName: string;
  path: string;
  frontmatter: Record<string, unknown>;
}
```

## Use Cases

### 1. Tool-Specific Model Configuration

Different CLI tools use different AI models:

```yaml
# claude/agents/reviewer.yaml
model: claude-3-5-sonnet
max_tokens: 4096

# copilot/agents/reviewer.yaml
model: gpt-4
max_completion_tokens: 4000
```

### 2. Feature Availability

Some features are CLI-specific:

```yaml
# cursor/agents/builder.yaml
cursor_features:
  - tab_autocomplete
  - semantic_search
  - workspace_index

# cline/agents/builder.yaml
cline_features:
  - mcp_integration
  - custom_tools
```

### 3. Tool-Specific Instructions

Customize instructions based on CLI capabilities:

```yaml
# claude/agents/explorer.yaml
system_prompt_suffix: |
  Use the grep and find tools to explore the codebase.
  Claude Code provides powerful search capabilities.

# copilot/agents/explorer.yaml
system_prompt_suffix: |
  Use workspace analysis and semantic search features.
  GitHub Copilot integrates with VS Code workspace.
```

## Best Practices

### 1. Keep Base Agents Generic

Base agents should contain universal instructions that work across all CLI tools:

✅ **Good:**
```markdown
---
name: reviewer
description: Reviews code for quality and best practices
---

Review the code for:
- Code quality
- Best practices
- Security issues
```

❌ **Bad (tool-specific in base):**
```markdown
---
name: reviewer
description: Reviews code using Claude's analysis
model: claude-3-5-sonnet  # Should be in CLI frontmatter
---
```

### 2. Use CLI Frontmatter for Tool-Specific Config

Put tool-specific configuration in CLI frontmatter files:

✅ **Good:**
```yaml
# claude/agents/reviewer.yaml
model: claude-3-5-sonnet
temperature: 0.3
tools: [grep, find, read_file]
```

### 3. Provide Sensible Defaults

Base agents should work without CLI frontmatter:

```yaml
# Base agent has reasonable defaults
temperature: 0.5
max_tokens: 2048

# CLI frontmatter can override
temperature: 0.7  # More creative for Cursor
```

### 4. Document CLI Compatibility

Clearly document which CLI tools each agent supports:

```markdown
# Agent Compatibility

- ✅ Claude Code
- ✅ GitHub Copilot
- ✅ Cursor
- ⚠️ Cline (limited features)
- ❌ Antigravity (not supported)
```

## Future Enhancements

- [ ] Agent version management and updates
- [ ] Agent dependency resolution
- [ ] Interactive agent selection during installation
- [ ] Agent marketplace integration
- [ ] Agent templates and scaffolding
- [ ] Agent testing and validation framework
- [ ] Multi-repository agent composition

## See Also

- [Resource Types](./resource-types.md) - Multi-resource type architecture
- [CLI Design](./cli-design.md) - Command-line interface patterns
- [Main README](../../README.md#agent-resources) - User-facing documentation
