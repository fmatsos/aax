# Positional Arguments Feature

## Overview

Support for resource names as positional arguments was added to improve CLI ergonomics and user experience.

## Feature Description

Users can now specify resource names directly after the source, instead of using the `--skill` flag:

**Before (flag-based):**
```bash
aax add skill vercel-labs/agent-skills --skill pr-review --skill commit
```

**After (positional):**
```bash
aax add skill vercel-labs/agent-skills pr-review commit
```

Both syntaxes are supported and can be combined.

## Implementation

### Parsing Logic

The `parseAddOptions` function in `src/add.ts` was enhanced to handle positional arguments:

```typescript
export function parseAddOptions(args: string[]): { source: string[]; options: AddOptions } {
  const options: AddOptions = {};
  const source: string[] = [];
  const positionalNames: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // ... flag handling ...

    if (arg && !arg.startsWith('-')) {
      // First non-flag arg is source, rest are skill names
      if (source.length === 0) {
        source.push(arg);
      } else {
        positionalNames.push(arg);
      }
    }
  }

  // Merge positional names with --skill flag names
  if (positionalNames.length > 0) {
    options.skill = options.skill || [];
    options.skill.unshift(...positionalNames);
  }

  return { source, options };
}
```

### Key Design Decisions

1. **First positional = source**: Maintains backward compatibility
2. **Additional positionals = names**: Natural extension of the syntax
3. **Merge with flags**: Positional names prepend to `--skill` values
4. **Order preservation**: Positional names appear first (using `unshift`)

## Usage Examples

### Single Resource Name

```bash
aax add skill vercel-labs/agent-skills pr-review
```

### Multiple Resource Names

```bash
aax add skill vercel-labs/agent-skills pr-review commit frontend-design
```

### Combining Positional and Flag

```bash
aax add skill vercel-labs/agent-skills pr-review --skill commit
# Results in: ['pr-review', 'commit']
```

### With Other Flags

```bash
aax add skill vercel-labs/agent-skills my-skill -g -y --agent claude-code
```

## Benefits

### User Experience

1. **Shorter commands**: Less typing for common use cases
2. **More intuitive**: Follows natural language order
3. **Industry standard**: Aligns with npm, pip, cargo patterns

### Backward Compatibility

- Existing `--skill` flag continues to work
- All existing commands remain valid
- No breaking changes

### Future-Ready

Prepares for marketplace integration:
```bash
# Future: source optional when marketplace exists
aax add skill my-skill
aax add skill my-skill --source custom-registry
```

## Testing

### Unit Tests

Added comprehensive tests in `src/add.test.ts`:

```typescript
it('should parse positional skill names after source', () => {
  const result = parseAddOptions(['source', 'skill-one', 'skill-two']);
  expect(result.source).toEqual(['source']);
  expect(result.options.skill).toEqual(['skill-one', 'skill-two']);
});

it('should merge positional skill names with --skill flag', () => {
  const result = parseAddOptions(['source', 'skill-one', '--skill', 'skill-two']);
  expect(result.options.skill).toEqual(['skill-one', 'skill-two']);
});
```

### Integration Tests

```typescript
it('should filter skills by positional name argument', () => {
  const result = runCli(['add', 'skill', testDir, 'skill-one', '--list'], testDir);
  expect(result.stdout).toContain('skill-one');
});
```

## Documentation Updates

1. **Help Text**: Updated to show `[names...]` syntax
2. **Examples**: Added examples demonstrating positional syntax
3. **README**: Updated command examples

## Related Work

This feature is part of a larger effort to improve CLI UX:

- [CLI Design](./cli-design.md) - Overall CLI structure
- [Subcommand-based CLI](../design-decisions/subcommand-based-cli.md) - Command structure rationale
- [Future Marketplace](./future-marketplace.md) - Planned enhancements

## Implementation References

- **PR**: feat: add support for resource names as positional arguments
- **Files Changed**:
  - `src/add.ts` - Parsing logic
  - `src/cli.ts` - Help text
  - `src/add.test.ts` - Tests
- **Commits**:
  - `ca52b4e` - feat: add support for resource names as positional arguments

## Future Enhancements

1. **Default Source**: When marketplace exists, make source optional
2. **Smart Detection**: Distinguish between source and name automatically
3. **Wildcards**: Support patterns in positional names
4. **Tab Completion**: Add shell completion for resource names
