# Subcommand-based CLI Design Decision

## Decision

Use a subcommand-based CLI structure where the resource type is specified as a subcommand rather than a flag.

**Chosen Structure:**
```bash
aax add skill <source>
aax remove skill <name>
aax list skill
```

**Rejected Structure:**
```bash
aax add <source> --skill
aax remove <name> --skill
aax list --skill
```

## Context

The aax CLI was originally designed to manage only skills. As we planned to expand support to multiple resource types (MCP servers, instructions, hooks), we needed to decide how users would specify which resource type they're working with.

## Options Considered

### Option 1: Resource Type as Flag (Original)

```bash
aax add <source> --skill <name>
aax add <source> --mcp <name>
aax add <source> --instruction <name>
```

**Pros:**
- Backward compatible with original design
- Shorter commands for single resource type
- Flags are optional, allowing defaults

**Cons:**
- Ambiguous when no flag provided
- Difficult to discover available resource types
- Inconsistent with common CLI patterns
- Help text less clear

### Option 2: Resource Type as Subcommand (Chosen)

```bash
aax add skill <source>
aax add mcp <source>
aax add instruction <source>
```

**Pros:**
- Explicit and unambiguous
- Easy to discover resource types via help
- Consistent with industry tools (kubectl, docker, etc.)
- Clean help text organization
- Future-proof for new resource types
- No default behavior confusion

**Cons:**
- Slightly longer commands
- Breaking change from original design
- Required migration of existing usage

### Option 3: Separate Commands per Resource

```bash
aax add-skill <source>
aax add-mcp <source>
aax add-instruction <source>
```

**Pros:**
- Very explicit
- No ambiguity

**Cons:**
- Command explosion as resources grow
- Harder to discover related commands
- Inconsistent with modern CLI design
- Verbose

## Decision Rationale

### 1. Explicitness

The subcommand structure makes it immediately clear what resource type is being managed:

```bash
# Clear: adding a skill
aax add skill vercel-labs/agent-skills

# Unclear: what type of resource?
aax add vercel-labs/agent-skills --skill pr-review
```

### 2. Discoverability

Help text naturally groups by resource type:

```
Manage Resources:
  add <type> <source>       Add a resource
  remove <type> [names]     Remove installed resources
  list <type>               List installed resources

Resource Types:
  skill            Agent skills (currently supported)
  mcp              MCP servers (planned)
  instruction      Instructions/rules (planned)
  hook             Hooks (planned)
```

### 3. Industry Standards

Modern CLI tools use subcommand structure:

- `kubectl get pods` (not `kubectl get --type pods`)
- `docker run container` (not `docker run --container`)
- `git commit -m "msg"` (not `git --commit -m "msg"`)
- `npm install package` (not `npm --install package`)

### 4. Future Extensibility

Adding new resource types is straightforward:

```bash
# Adding a new resource type requires minimal changes
aax add plugin <source>
```

With flags, each new type requires new flag handling everywhere.

### 5. Error Messages

Clear, actionable error messages:

```
Error: Resource type is required. Use: skill, mcp, instruction, or hook
Examples:
  aax add skill <source>
  aax remove skill <name>
  aax list skill
```

### 6. Consistency

Same pattern across all commands:
- `aax add skill ...`
- `aax remove skill ...`
- `aax list skill ...`

## Implementation Impact

### Code Changes

1. **CLI Router** (`src/cli.ts`):
   ```typescript
   case 'add': {
     const resourceType = restArgs[0]; // Extract subcommand
     const addArgs = restArgs.slice(1);
     // ...
   }
   ```

2. **Resource Type Validation** (`src/resource-type.ts`):
   ```typescript
   export function parseResourceType(subcommand: string | undefined): ResourceType {
     if (!subcommand) {
       throw new Error('Resource type is required. Use: skill, mcp, instruction, or hook');
     }
     // ...
   }
   ```

3. **Commands**: All commands receive `_resourceType` parameter

### Migration

**Breaking Change:** Yes, this was a breaking change from the original design.

**Mitigation:**
- Clear migration guide
- Updated all examples and documentation
- Helpful error messages for old syntax

## Trade-offs

### Accepted Trade-offs

1. **Longer Commands**: `aax add skill` vs `aax add`
   - Acceptable: Clarity worth the extra characters
   - Mitigated: Shell aliases for frequent commands

2. **Breaking Change**: Requires user migration
   - Acceptable: Early in project lifecycle
   - Mitigated: Clear migration path

### Rejected Trade-offs

1. **Default Behavior**: Could default to `skill` if no type provided
   - Rejected: Creates confusion and hidden complexity
   - Better: Explicit is better than implicit

2. **Backward Compatibility**: Could support both syntaxes
   - Rejected: Increases maintenance burden
   - Better: Clean break with clear migration

## Results

### Positive Outcomes

1. **Clarity**: Users always know what they're managing
2. **Discoverability**: Help text clearly shows options
3. **Consistency**: Same pattern everywhere
4. **Extensibility**: Easy to add new resource types

### User Feedback

- Initial resistance to longer commands
- Quick adaptation once understood
- Appreciation for clarity
- Easier onboarding for new users

## Lessons Learned

1. **Early is Better**: Breaking changes easier early in project
2. **Explicit Wins**: Clarity beats brevity
3. **Industry Standards**: Following patterns users know helps adoption
4. **Good Errors**: Clear error messages ease migration

## Future Considerations

### Potential Enhancements

1. **Shell Completion**: Add completion for resource types
2. **Aliases**: Smart aliases for power users
3. **Context**: Remember last used resource type per directory

### If We Did It Again

Would we make the same choice? **Yes.**

The benefits of clarity and consistency far outweigh the cost of longer commands.

## See Also

- [CLI Design](../architecture/cli-design.md) - Overall CLI structure
- [Resource Types](../architecture/resource-types.md) - Resource type system
- [Positional Arguments](../architecture/positional-arguments.md) - Name syntax
