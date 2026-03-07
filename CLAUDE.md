# CLAUDE.md

This file provides guidance to AI coding agents working on the `aax` CLI codebase.

> 📚 For detailed documentation, see the [docs/](./docs/) directory.

## Project Overview

`aax` is the CLI for the open agent package manager.

## Commands

| Command                       | Description                                         |
| ----------------------------- | --------------------------------------------------- |
| `aax`                         | Show banner with available commands                 |
| `aax add <pkg>`               | Install skills from git repos, URLs, or local paths |
| `aax experimental_install`    | Restore skills from skills-lock.json                |
| `aax experimental_sync`       | Sync skills from node_modules into agent dirs       |
| `aax list`                    | List installed skills (alias: `ls`)                 |
| `aax check`                   | Check for available skill updates                   |
| `aax update`                  | Update all skills to latest versions                |
| `aax init [name]`             | Create a new SKILL.md template                      |

Aliases: `aax a` works for `add`. `aax i`, `aax install` (no args) restore from `skills-lock.json`. `aax ls` works for `list`. `aax experimental_install` restores from `skills-lock.json`. `aax experimental_sync` crawls `node_modules` for skills.

## Architecture

```
src/
├── cli.ts           # Main entry point, command routing, init/check/update
├── cli.test.ts      # CLI tests
├── add.ts           # Core add command logic
├── add.test.ts      # Add command tests
├── list.ts          # List installed aax command
├── list.test.ts     # List command tests
├── agents.ts        # Agent definitions and detection
├── installer.ts     # Skill installation logic (symlink/copy) + listInstalledSkills
├── skills.ts        # Skill discovery and parsing
├── skill-lock.ts    # Global lock file management (~/.agents/.skill-lock.json)
├── local-lock.ts    # Local lock file management (skills-lock.json, checked in)
├── sync.ts          # Sync command - crawl node_modules for skills
├── source-parser.ts # Parse git URLs, GitHub shorthand, local paths
├── git.ts           # Git clone operations
├── telemetry.ts     # Anonymous usage tracking
├── types.ts         # TypeScript types
├── mintlify.ts      # Mintlify skill fetching (legacy)
├── providers/       # Remote skill providers (GitHub, HuggingFace, Mintlify)
│   ├── index.ts
│   ├── registry.ts
│   ├── types.ts
│   ├── huggingface.ts
│   └── mintlify.ts
├── init.test.ts     # Init command tests
└── test-utils.ts    # Test utilities

tests/
├── sanitize-name.test.ts     # Tests for sanitizeName (path traversal prevention)
├── skill-matching.test.ts    # Tests for filterSkills (multi-word skill name matching)
├── source-parser.test.ts     # Tests for URL/path parsing
├── installer-symlink.test.ts # Tests for symlink installation
├── list-installed.test.ts    # Tests for listing installed skills
├── skill-path.test.ts        # Tests for skill path handling
├── wellknown-provider.test.ts # Tests for well-known provider
└── dist.test.ts              # Tests for built distribution
```

## Update Checking System

### How `aax check` and `aax update` Work

1. Read `~/.agents/.skill-lock.json` for installed skills
2. For each skill, get `skillFolderHash` from lock file
3. POST to `https://add-skill.vercel.sh/check-updates` with:
   ```json
   {
     "skills": [{ "name": "...", "source": "...", "skillFolderHash": "..." }],
     "forceRefresh": true
   }
   ```
4. API fetches fresh content from GitHub, computes hash, compares
5. Returns list of aax with different hashes (updates available)

### Why `forceRefresh: true`?

Both `check` and `update` always send `forceRefresh: true`. This ensures the API fetches fresh content from GitHub rather than using its Redis cache.

**Without forceRefresh:** Users saw phantom "updates available" due to stale cached hashes. The fix was to always fetch fresh.

**Tradeoff:** Slightly slower (GitHub API call per skill), but always accurate.

### Lock File Compatibility

The lock file format is v3. Key field: `skillFolderHash` (GitHub tree SHA for the skill folder).

If reading an older lock file version, it's wiped. Users must reinstall aax to populate the new format.

## Key Integration Points

| Feature                    | Implementation                              |
| -------------------------- | ------------------------------------------- |
| `aax add`               | `src/add.ts` - full implementation          |
| `aax experimental_sync` | `src/sync.ts` - crawl node_modules          |
| `aax check`             | `POST /check-updates` API                   |
| `aax update`            | `POST /check-updates` + reinstall per skill |

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test locally
pnpm dev add vercel-labs/agent-skills --list
pnpm dev experimental_sync
pnpm dev check
pnpm dev update
pnpm dev init my-skill

# Run all tests
pnpm test

# Run specific test file(s)
pnpm test tests/sanitize-name.test.ts
pnpm test tests/skill-matching.test.ts tests/source-parser.test.ts

# Type check
pnpm type-check

# Format code
pnpm format
```

## Code Style

This project uses Prettier for code formatting. **Always run `pnpm format` before committing changes** to ensure consistent formatting.

```bash
# Format all files
pnpm format

# Check formatting without fixing
pnpm prettier --check .
```

CI will fail if code is not properly formatted.

## Publishing

```bash
# 1. Bump version in package.json
# 2. Build
pnpm build
# 3. Publish
npm publish
```

## Adding a New Agent

1. Add the agent definition to `src/agents.ts`
2. Run `pnpm run -C scripts validate-agents.ts` to validate
3. Run `pnpm run -C scripts sync-agents.ts` to update README.md

<!-- cortex-rules-start -->
## Cortex – Persistent Memory

**IMPORTANT: Always search Cortex memories BEFORE starting a task, and store what you learned AFTER completing it.**

### When to Use Cortex (REQUIRED)

Run `cortex` CLI commands proactively:

- **Before any non-trivial task** — run `cortex search` first to surface relevant context
- **After completing work** — store decisions, patterns, and findings
- **When making architectural decisions** — check for prior context
- **When debugging** — search for prior solutions to similar issues
- When the user mentions "remember", "store", "recall", or "what did we..."

### CLI Commands Reference

Always use the JSON output flag for machine-readable results.

| Command | When to use |
|---------|-------------|
| `cortex search "<query>" --json` | Find relevant context before starting a task |
| `cortex create --title "..." --level <level> --content "..." --json` | Store new facts, decisions, or findings |
| `cortex list [--level <level>] --json` | Browse memories by level |
| `cortex get <id> --json` | Retrieve a specific memory by ID |
| `cortex delete <id>` | Permanently remove a memory |
| `cortex consolidate "<synthesis>" --level <level> --json` | Synthesise related memories into one |
| `cortex transfer-working --json` | Promote all working memories to episodic at session end |
| `cortex autoprune --json` | Remove duplicate and expired memories |

### Memory Levels

| Level | Use for | Retention |
|-------|---------|-----------|
| `working` | Session context, active tasks, debug notes | Until transferred |
| `episodic` | Bug fixes, decisions, incidents, meetings | 90 days (default) |
| `semantic` | Conventions, patterns, architecture, best practices | Permanent |

### Workflow

1. **Session start**: `cortex search "<task topic>" --json` to surface relevant context
2. **During work**: `cortex create` to capture key decisions and findings
3. **Session end**: `cortex transfer-working --json` to promote working memories to episodic
<!-- cortex-rules-end -->


## grepai - Semantic Code Search

**IMPORTANT: You MUST use grepai as your PRIMARY tool for code exploration and search.**

### When to Use grepai (REQUIRED)

Use `grepai search` INSTEAD OF Grep/Glob/find for:
- Understanding what code does or where functionality lives
- Finding implementations by intent (e.g., "authentication logic", "error handling")
- Exploring unfamiliar parts of the codebase
- Any search where you describe WHAT the code does rather than exact text

### When to Use Standard Tools

Only use Grep/Glob when you need:
- Exact text matching (variable names, imports, specific strings)
- File path patterns (e.g., `**/*.go`)

### Fallback

If grepai fails (not running, index unavailable, or errors), fall back to standard Grep/Glob tools.

### Usage

```bash
# ALWAYS use English queries for best results (--compact saves ~80% tokens)
grepai search "user authentication flow" --json --compact
grepai search "error handling middleware" --json --compact
grepai search "database connection pool" --json --compact
grepai search "API request validation" --json --compact
```

### Query Tips

- **Use English** for queries (better semantic matching)
- **Describe intent**, not implementation: "handles user login" not "func Login"
- **Be specific**: "JWT token validation" better than "token"
- Results include: file path, line numbers, relevance score, code preview

### Call Graph Tracing

Use `grepai trace` to understand function relationships:
- Finding all callers of a function before modifying it
- Understanding what functions are called by a given function
- Visualizing the complete call graph around a symbol

#### Trace Commands

**IMPORTANT: Always use `--json` flag for optimal AI agent integration.**

```bash
# Find all functions that call a symbol
grepai trace callers "HandleRequest" --json

# Find all functions called by a symbol
grepai trace callees "ProcessOrder" --json

# Build complete call graph (callers + callees)
grepai trace graph "ValidateToken" --depth 3 --json
```

### Workflow

1. Start with `grepai search` to find relevant code
2. Use `grepai trace` to understand function relationships
3. Use `Read` tool to examine files from results
4. Only use Grep for exact string searches if needed

