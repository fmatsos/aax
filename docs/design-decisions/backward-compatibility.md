# Backward Compatibility Strategy

## Principle

Maintain compatibility whenever possible, break only when absolutely necessary, and provide clear migration paths when breaking changes are unavoidable.

## Compatibility Levels

### 1. Full Compatibility (Preferred)

Changes that maintain 100% backward compatibility:

✅ **Examples:**
- Adding new commands
- Adding new options/flags
- Adding new resource types
- Enhancing existing features without changing behavior

```bash
# Old command still works
aax add skill vercel-labs/agent-skills

# New feature available
aax add skill vercel-labs/agent-skills pr-review
```

### 2. Opt-in Changes

New behavior available through explicit opt-in:

✅ **Examples:**
- Positional arguments (alternative to `--skill` flag)
- New flags that don't affect default behavior

```bash
# Original syntax works
aax add skill vercel-labs/agent-skills --skill pr-review

# New syntax also works
aax add skill vercel-labs/agent-skills pr-review

# Both are equivalent
```

### 3. Deprecation Path

Features marked for removal with clear migration timeline:

⚠️ **Process:**
1. Add deprecation warning
2. Document replacement
3. Maintain for at least one major version
4. Remove in next major version

```bash
# Deprecated command shows warning
$ aax install
Warning: 'aax install' is deprecated. Use 'aax experimental_install' instead.

# New command works
$ aax experimental_install
```

### 4. Breaking Changes

Changes that cannot maintain compatibility:

❌ **Only When:**
- Security vulnerability
- Critical design flaw
- Blocking future development

**Requirements:**
- Major version bump
- Migration guide
- Clear communication
- Helpful error messages

## Compatibility Guidelines

### Command Structure

**DO:**
- Add new commands freely
- Add new subcommands under existing commands
- Add new options with sensible defaults

**DON'T:**
- Remove existing commands without deprecation
- Change existing option behavior
- Change output formats without flag

### Options and Flags

**DO:**
- Add new optional flags
- Make flags more permissive over time
- Provide sensible defaults for new options

**DON'T:**
- Remove flags without deprecation
- Change flag meanings
- Make flags more restrictive

### Data Formats

**DO:**
- Add new fields to JSON output
- Support multiple input formats
- Version data formats

**DON'T:**
- Remove fields from output
- Change field types
- Break parsing of existing formats

### Lock Files

**Strategy:**
```typescript
// Version the lock file format
{
  "version": 3,
  "skills": [...]
}

// Handle old versions gracefully
if (lockFile.version < 3) {
  // Migrate or warn user
}
```

## Case Studies

### Case Study 1: Subcommand-based CLI

**Change:** Move from flag-based to subcommand-based resource types

**Decision:** Breaking change, but worth it

**Rationale:**
- Early in project lifecycle
- Foundation for future extensibility
- Better user experience long-term

**Migration:**
```bash
# Old (no longer supported)
aax add vercel-labs/agent-skills --skill pr-review

# New (required)
aax add skill vercel-labs/agent-skills pr-review
```

**Support:**
- Clear error messages
- Updated documentation
- Migration guide
- New examples

### Case Study 2: Positional Arguments

**Change:** Add resource names as positional arguments

**Decision:** Additive, fully compatible

**Implementation:**
```typescript
// Old syntax still works
parseAddOptions(['source', '--skill', 'name'])

// New syntax also works
parseAddOptions(['source', 'name'])

// Can be combined
parseAddOptions(['source', 'name1', '--skill', 'name2'])
```

**Result:** Zero breaking changes, improved UX

### Case Study 3: Removed Aliases

**Change:** Remove `i`, `a`, `r` command aliases

**Decision:** Breaking change for clarity

**Rationale:**
- Aliases create ambiguity
- `i` could mean install or init
- Better to be explicit

**Kept Aliases:**
- `ls` for `list` (industry standard)
- `rm` for `remove` (industry standard)

**Migration:**
```bash
# Old shortcuts removed
aax i  # Error: Unknown command

# Use full commands
aax experimental_install

# Or kept aliases
aax ls  # Works: alias for 'list'
```

## Compatibility Testing

### Test Suite

Maintain tests for backward compatibility:

```typescript
describe('backward compatibility', () => {
  it('should support --skill flag syntax', () => {
    const result = parseAddOptions(['source', '--skill', 'name']);
    expect(result.options.skill).toEqual(['name']);
  });

  it('should support positional name syntax', () => {
    const result = parseAddOptions(['source', 'name']);
    expect(result.options.skill).toEqual(['name']);
  });

  it('should combine both syntaxes', () => {
    const result = parseAddOptions(['source', 'name1', '--skill', 'name2']);
    expect(result.options.skill).toEqual(['name1', 'name2']);
  });
});
```

### Version Testing

Test against previous versions:

```bash
# Test current version
npm test

# Test against lock files from v1, v2, v3
npm run test:compat
```

## Communication

### When Making Breaking Changes

1. **Announce Early**: Blog post, changelog, GitHub issue
2. **Provide Timeline**: Clear deprecation schedule
3. **Document Migration**: Step-by-step guide
4. **Update Examples**: All docs show new way
5. **Helpful Errors**: Point to migration guide

### Changelog Format

```markdown
## [2.0.0] - 2024-XX-XX

### BREAKING CHANGES
- Resource type now required as subcommand
  - **Before:** `aax add <source> --skill <name>`
  - **After:** `aax add skill <source> <name>`
  - See [migration guide](docs/migrations/v2.md)

### Added
- Positional arguments for resource names

### Changed
- Improved help text formatting

### Deprecated
- None

### Removed
- Aliases `i`, `a`, `r` (use full commands)
```

## Version Strategy

### Semantic Versioning

- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Pre-1.0 License

During 0.x versions:
- More freedom for breaking changes
- Faster iteration
- Clear communication still required

### Post-1.0 Commitment

After 1.0:
- Strong backward compatibility
- Rare breaking changes
- Long deprecation periods

## Future Considerations

### Marketplace Integration

When adding marketplace support:

**Compatible Approach:**
```bash
# Existing commands continue working
aax add skill vercel-labs/agent-skills pr-review

# New marketplace syntax also works
aax add skill pr-review

# Source flag for compatibility
aax add skill pr-review --source vercel-labs/agent-skills
```

### Multi-version Support

Consider supporting multiple API versions:

```bash
# Specify version for old behavior
aax --api-version v1 add ...

# Default to latest
aax add ...
```

## Best Practices

1. **Test Backward Compatibility**: Automated tests for old behavior
2. **Document Changes**: Clear changelog and migration guides
3. **Gradual Deprecation**: Warnings before removal
4. **User Communication**: Announce changes early
5. **Helpful Errors**: Guide users to correct syntax

## See Also

- [CLI Design](../architecture/cli-design.md) - Command structure
- [Subcommand-based CLI](./subcommand-based-cli.md) - Major breaking change
- [Resource Types](../architecture/resource-types.md) - Extensible design
