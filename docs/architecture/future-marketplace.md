# Future Marketplace Integration

## Overview

The aax CLI is designed with a future marketplace in mind, where resources (skills, MCP servers, etc.) can be discovered and installed from a centralized registry, similar to npm, pip, or cargo.

## Vision

### Current State
```bash
# Must specify source (GitHub repo, URL, etc.)
aax add skill vercel-labs/agent-skills pr-review
```

### Future State
```bash
# Install from default marketplace
aax add skill pr-review

# Override with custom source
aax add skill pr-review --source vercel-labs/agent-skills
```

## Marketplace Features

### Resource Discovery

**Search and Browse**
```bash
# Enhanced search with marketplace integration
aax find pr-review

# Browse by category
aax browse --category code-review

# Show trending resources
aax trending
```

**Resource Information**
```bash
# View detailed info from marketplace
aax info pr-review

# Show dependencies
aax info pr-review --dependencies

# View version history
aax versions pr-review
```

### Installation

**From Marketplace**
```bash
# Install latest version
aax add skill pr-review

# Install specific version
aax add skill pr-review@1.2.3

# Install with version range
aax add skill pr-review@^1.0.0
```

**Version Management**
```bash
# Lock to specific versions
aax add skill pr-review@1.2.3 --save-exact

# Update to latest compatible
aax update pr-review

# Upgrade to latest (including breaking changes)
aax upgrade pr-review --latest
```

### Publishing

**Skill Authors**
```bash
# Initialize skill manifest
aax init my-skill --marketplace

# Validate before publishing
aax validate my-skill

# Publish to marketplace
aax publish my-skill

# Update published skill
aax publish my-skill --patch
```

## Technical Architecture

### Marketplace Registry

**Registry Structure**
```
https://registry.aax.sh/
├── /skill/
│   ├── pr-review/
│   │   ├── metadata.json
│   │   ├── versions.json
│   │   └── 1.2.3/
│   │       ├── SKILL.md
│   │       └── manifest.json
│   └── frontend-design/
├── /mcp/
├── /instruction/
└── /hook/
```

**Metadata Schema**
```json
{
  "name": "pr-review",
  "type": "skill",
  "description": "Generate comprehensive PR review comments",
  "author": "username",
  "repository": "https://github.com/user/repo",
  "license": "MIT",
  "tags": ["code-review", "git", "automation"],
  "downloads": 15234,
  "stars": 234,
  "versions": {
    "latest": "1.2.3",
    "stable": "1.2.2"
  }
}
```

### CLI Integration

**Configuration**
```bash
# Default registry
aax config set registry https://registry.aax.sh

# Add custom registry
aax config set registry:custom https://company.com/registry

# Use specific registry for install
aax add skill pr-review --registry custom
```

**Authentication**
```bash
# Login to publish
aax login

# Logout
aax logout

# Check auth status
aax whoami
```

### Source Resolution Order

When a resource is requested, resolve in this order:

1. **Explicit source**: `--source` flag provided
2. **Version specified**: `pr-review@1.2.3` - lookup in marketplace
3. **Marketplace**: Search default registry
4. **Custom registries**: Check configured registries
5. **Error**: Source not found

## Migration Path

### Phase 1: Preparation (Current)
- ✅ Subcommand-based CLI structure
- ✅ Positional arguments support
- ✅ Resource type abstraction
- ✅ Update system in place

### Phase 2: Registry Backend
- [ ] Build marketplace API
- [ ] Implement package hosting
- [ ] Version management system
- [ ] Authentication/authorization

### Phase 3: CLI Integration
- [ ] Registry client implementation
- [ ] Name resolution logic
- [ ] Version specification parsing
- [ ] Publishing workflow

### Phase 4: Enhanced Discovery
- [ ] Advanced search filters
- [ ] Recommendation engine
- [ ] Usage statistics
- [ ] Community ratings

### Phase 5: Ecosystem
- [ ] Verified publishers
- [ ] Security scanning
- [ ] Dependency management
- [ ] Breaking change detection

## Design Principles

### 1. Backward Compatibility

All existing commands will continue to work:
```bash
# This will always work
aax add skill vercel-labs/agent-skills pr-review
```

### 2. Explicit Over Implicit

When ambiguity exists, require explicit specification:
```bash
# Ambiguous - could be source or name
aax add skill something

# Solution: make source optional only when clearly a registry name
aax add skill pr-review  # Obviously a registry name
aax add skill owner/repo # Obviously a GitHub repo
```

### 3. Progressive Enhancement

New features are additive:
- `@version` syntax for versioning
- `--source` flag for custom sources
- `--registry` flag for alternate registries

### 4. Offline Support

Cache marketplace data locally:
```bash
# Work offline with cache
aax add skill pr-review --offline

# Refresh cache
aax cache clean
aax cache update
```

## Security Considerations

### Package Integrity

- **Checksums**: Verify downloaded resources
- **Signatures**: Support signed packages
- **Audit trail**: Track installation sources

### Namespace Protection

- **Reserved names**: Protect official packages
- **Verified authors**: Badge for trusted publishers
- **Naming conflicts**: Scoped packages like `@org/skill-name`

### Malicious Code Detection

- **Static analysis**: Scan before publishing
- **Community reports**: Flag suspicious packages
- **Automated takedown**: Remove confirmed malware

## User Benefits

### For Users

1. **Easier discovery**: Find resources without leaving CLI
2. **Faster installation**: No need to remember GitHub URLs
3. **Version control**: Lock to specific versions
4. **Trust signals**: See download counts, ratings

### For Authors

1. **Wider reach**: Publish once, available to all
2. **Version management**: Automatic versioning
3. **Usage analytics**: See adoption metrics
4. **Community feedback**: Ratings and issues

## See Also

- [CLI Design](./cli-design.md) - Command structure
- [Positional Arguments](./positional-arguments.md) - Name-first syntax
- [Resource Types](./resource-types.md) - Multi-resource support
