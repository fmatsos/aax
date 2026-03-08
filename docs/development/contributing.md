# Contributing to aax

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/fmatsos/aax.git
cd aax

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test
```

## Development Workflow

### Running Locally

```bash
# Run the CLI in development mode
pnpm dev add vercel-labs/agent-skills --list

# Test specific commands
pnpm dev list skill
pnpm dev check
pnpm dev update
```

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Format code**
   ```bash
   pnpm format
   ```

4. **Run tests**
   ```bash
   pnpm test
   ```

5. **Type check**
   ```bash
   pnpm type-check
   ```

### Code Style

This project uses Prettier for code formatting. **Always run `pnpm format` before committing.**

```bash
# Format all files
pnpm format

# Check formatting without fixing
pnpm prettier --check .
```

**Important:** CI will fail if code is not properly formatted.

## Project Structure

```
src/
├── cli.ts           # Main entry point, command routing
├── add.ts           # Add command implementation
├── remove.ts        # Remove command implementation
├── list.ts          # List command implementation
├── agents.ts        # Agent definitions and detection
├── installer.ts     # Installation logic (symlink/copy)
├── skills.ts        # Skill discovery and parsing
├── resource-type.ts # Resource type abstraction
├── skill-lock.ts    # Global lock file management
├── local-lock.ts    # Local lock file management
├── source-parser.ts # URL and path parsing
├── git.ts           # Git operations
├── telemetry.ts     # Usage tracking
└── types.ts         # TypeScript types

tests/
├── *.test.ts        # Unit tests
└── integration/     # Integration tests
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/add.test.ts

# Run multiple test files
pnpm test src/add.test.ts src/remove.test.ts

# Watch mode (for development)
pnpm test --watch

# Coverage
pnpm test --coverage
```

### Writing Tests

Use Vitest for testing:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('feature name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    // Test
    expect(result).toBe(expected);
  });
});
```

### Test Coverage

Aim for high test coverage, especially for:
- Core command logic
- Parsing functions
- Edge cases and error handling

## Adding a New Feature

### 1. Plan

- Create an issue describing the feature
- Discuss approach if significant change
- Review existing architecture docs

### 2. Implement

- Write failing tests first (TDD)
- Implement the feature
- Make tests pass
- Refactor if needed

### 3. Document

- Update relevant documentation
- Add JSDoc comments
- Update CHANGELOG.md

### 4. Submit

- Create pull request
- Describe changes clearly
- Link to related issues

## Adding a New Agent

1. **Add agent definition** to `src/agents.ts`:
   ```typescript
   'my-agent': {
     displayName: 'My Agent',
     skillsDir: '.myagent/skills/',
     globalSkillsDir: '~/.myagent/skills/',
   }
   ```

2. **Validate**:
   ```bash
   pnpm run -C scripts validate-agents.ts
   ```

3. **Update README**:
   ```bash
   pnpm run -C scripts sync-agents.ts
   ```

## Code Review Guidelines

### For Authors

- Keep PRs focused and small
- Write clear commit messages
- Add tests for new features
- Update documentation
- Respond to feedback promptly

### For Reviewers

- Be constructive and kind
- Check for test coverage
- Verify documentation updates
- Test changes locally
- Suggest improvements

## Commit Messages

Follow Conventional Commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test changes
- `refactor`: Code refactoring
- `style`: Formatting changes
- `chore`: Build/tooling changes

**Examples:**
```
feat(add): add support for positional resource names

Add ability to specify resource names as positional arguments
instead of only using --skill flag.

Closes #123
```

## Release Process

1. **Version bump**
   ```bash
   # Update version in package.json
   npm version patch|minor|major
   ```

2. **Update changelog**
   ```bash
   # Edit CHANGELOG.md
   ```

3. **Build**
   ```bash
   pnpm build
   ```

4. **Publish**
   ```bash
   npm publish
   ```

## Getting Help

- **Questions**: Open a discussion
- **Bugs**: Open an issue
- **Features**: Open an issue for discussion first
- **Security**: Email security@aax.sh

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to make aax better.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## See Also

- [Testing Guide](./testing.md) - Detailed testing information
- [Code Style](./code-style.md) - Style guidelines
- [Architecture](../architecture/) - System design docs
