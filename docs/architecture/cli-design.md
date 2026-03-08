# CLI Design

## Overview

The aax CLI uses a subcommand-based structure that prioritizes explicitness and future extensibility while maintaining an intuitive user experience.

## Command Structure

### Basic Pattern

```bash
aax <command> <resource-type> [arguments] [options]
```

**Examples:**
```bash
aax add skill vercel-labs/agent-skills
aax remove skill my-skill
aax list skill
```

### Rationale

This structure was chosen for several key reasons:

1. **Explicitness**: No ambiguity about what resource type is being managed
2. **Extensibility**: Easy to add new resource types (mcp, instruction, hook)
3. **Consistency**: Same pattern across all commands
4. **Discoverability**: Help text clearly shows available resource types

## Commands

### Resource Management

| Command | Description | Example |
|---------|-------------|---------|
| `add` | Install resources | `aax add skill <source> [names...]` |
| `remove` | Uninstall resources | `aax remove skill [names...]` |
| `list` | Show installed resources | `aax list skill` |

### Discovery & Search

| Command | Description | Example |
|---------|-------------|---------|
| `find` | Interactive search | `aax find [query]` |

### Maintenance

| Command | Description | Example |
|---------|-------------|---------|
| `check` | Check for updates | `aax check` |
| `update` | Update all resources | `aax update` |

### Development

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Create new resource | `aax init [name]` |

## Global Options

Options that work across all commands:

| Option | Short | Description |
|--------|-------|-------------|
| `--global` | `-g` | Operate at user-level instead of project-level |
| `--agent` | `-a` | Target specific agents |
| `--yes` | `-y` | Skip confirmation prompts |
| `--help` | `-h` | Show help message |
| `--version` | `-v` | Show version number |

## Command Aliases

For common commands, we provide aliases:

| Alias | Command |
|-------|---------|
| `ls` | `list` |
| `rm` | `remove` |

**Note:** We intentionally removed some aliases (like `i`, `a`, `r`) to promote explicitness.

## Argument Parsing

### Add Command

```typescript
parseAddOptions(args: string[]): { source: string[]; options: AddOptions }
```

**Positional Arguments:**
1. First non-flag arg = source (required)
2. Additional non-flag args = resource names (optional)

**Example:**
```bash
aax add skill vercel-labs/agent-skills pr-review commit
#           │   └─── source ───────────┘ └─ names ─┘
```

### Remove Command

```typescript
parseRemoveOptions(args: string[]): { skills: string[]; options: RemoveOptions }
```

**Positional Arguments:**
- All non-flag args = resource names to remove

**Example:**
```bash
aax remove skill web-design frontend-design
#              │  └──── names to remove ────┘
```

## Error Handling

### Clear Error Messages

When resource type is missing or invalid:

```
Error: Resource type is required. Use: skill, mcp, instruction, or hook
Examples:
  aax add skill <source>
  aax remove skill <name>
  aax list skill
```

### Validation

- Source validation (file exists, valid URL, etc.)
- Agent validation (known agent types)
- Resource name validation (installed, available)

## Design Philosophy

### 1. Progressive Disclosure

Basic usage is simple:
```bash
aax add skill vercel-labs/agent-skills
```

Advanced features require more explicit syntax:
```bash
aax add skill vercel-labs/agent-skills pr-review --agent claude-code -g -y
```

### 2. Sensible Defaults

- Install to project scope by default (`--global` for user scope)
- Interactive mode by default (`--yes` to skip prompts)
- Auto-detect agents when possible

### 3. Composability

Options can be combined naturally:
```bash
aax add skill <source> <name> -g -y --agent claude-code --copy
```

### 4. Future-Proof

The structure accommodates future resource types:
```bash
aax add mcp <source> [names...]
aax add instruction <source> [names...]
aax add hook <source> [names...]
```

## User Experience Considerations

### Feedback

- Show progress with spinners
- Display clear success/error messages
- Provide actionable next steps

### Safety

- Confirm destructive operations (unless `--yes`)
- Show what will be affected before acting
- Validate inputs early

### Discoverability

- Comprehensive `--help` for each command
- Examples in help text
- Link to online documentation

## See Also

- [Positional Arguments](./positional-arguments.md) - Resource name as positional argument
- [Subcommand-based CLI](../design-decisions/subcommand-based-cli.md) - Why this structure
- [Resource Types](./resource-types.md) - Resource type system
