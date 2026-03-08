# Update System

## Overview

The aax CLI includes an update checking and installation system that allows users to keep their installed skills up to date with the latest versions from source repositories.

## Commands

### Check for Updates

```bash
aax check
```

Checks all installed skills for available updates without making any changes.

### Apply Updates

```bash
aax update
```

Updates all skills that have available updates to their latest versions.

## How It Works

### 1. Read Installed Skills

The system reads from the global lock file (`~/.agents/.skill-lock.json`):

```json
{
  "version": 3,
  "skills": [
    {
      "name": "pr-review",
      "source": "vercel-labs/agent-skills",
      "sourceUrl": "https://github.com/vercel-labs/agent-skills.git",
      "skillPath": "skills/pr-review/SKILL.md",
      "skillFolderHash": "abc123...",
      "agents": ["claude-code"],
      "global": true,
      "installMode": "symlink"
    }
  ]
}
```

### 2. Hash Comparison

For each skill, the system:

1. Extracts the `skillFolderHash` from the lock file
2. Sends a request to the update API
3. API fetches current state from GitHub
4. API computes current hash
5. API compares hashes

### 3. API Request

POST to `https://add-skill.vercel.sh/check-updates`:

```json
{
  "skills": [
    {
      "name": "pr-review",
      "source": "vercel-labs/agent-skills",
      "skillFolderHash": "abc123..."
    }
  ],
  "forceRefresh": true
}
```

### 4. API Response

```json
{
  "updates": [
    {
      "name": "pr-review",
      "currentHash": "abc123...",
      "latestHash": "def456...",
      "hasUpdate": true
    }
  ]
}
```

### 5. Apply Updates

For each skill with updates:

1. Build reinstall URL with skill path
2. Run `npx @fmatsos/aax add <url> -g -y`
3. Track success/failure
4. Update lock file

## Design Decisions

### Force Refresh

**Decision:** Always send `forceRefresh: true` to the API

**Rationale:**
- Without it: Users saw phantom "updates available" due to stale cache
- API caches GitHub tree SHAs in Redis
- Cache could be stale if repo updated recently
- Better to be always accurate than sometimes fast

**Tradeoff:**
- Slightly slower (GitHub API call per skill)
- But always correct

### Hash-based Detection

**Decision:** Use Git tree SHA as hash, not commit SHA

**Rationale:**
- Tree SHA represents content of skill folder
- Unchanged if commits don't touch skill folder
- More accurate than commit SHA
- Reduces false positive updates

**How it works:**
```bash
# GitHub tree API provides SHA for directory
GET /repos/owner/repo/git/trees/main:skills/pr-review
# Returns tree SHA for that exact directory state
```

### Lock File Version

**Current Version:** v3

**Schema:**
```typescript
interface LockFile {
  version: 3;
  skills: Array<{
    name: string;
    source: string;
    sourceUrl: string;
    skillPath: string;
    skillFolderHash: string;  // Key field for updates
    agents: string[];
    global: boolean;
    installMode: 'symlink' | 'copy';
    timestamp?: string;
  }>;
}
```

**Migration:**
- If reading old version, wipe and require reinstall
- No automatic migration (too error-prone)
- Users must reinstall to populate new format

### Update Strategy

**Decision:** Reinstall from source

**Rationale:**
- Simple and reliable
- Reuses existing install logic
- Ensures clean state
- Handles renamed/moved files

**Alternative Considered:** In-place update
- More complex
- Harder to handle edge cases
- Risk of corrupt state

## User Experience

### Check Output

```
Checking for updates...
✓ No updates available

All skills are up to date
```

Or:

```
Checking for updates...
Found 2 update(s)

Skill: pr-review
Source: vercel-labs/agent-skills
Status: Update available

Skill: frontend-design
Source: vercel-labs/agent-skills
Status: Update available

Run 'aax update' to install updates
```

### Update Output

```
Updating pr-review...
  ✓ Updated pr-review

Updating frontend-design...
  ✓ Updated frontend-design

✓ Updated 2 skill(s)
```

## Edge Cases

### Skill Moved/Renamed

If a skill moves within a repo:
- Old path hash won't match
- Shows as update available
- Reinstall gets from new path
- Lock file updated with new path

### Skill Deleted

If a skill is removed from source:
- Install will fail
- User notified
- Old version remains installed
- Manual removal required

### Source Unreachable

If GitHub is down or repo deleted:
- Check fails gracefully
- User notified
- No changes made
- Can retry later

### Rate Limiting

GitHub API has rate limits:
- Public API: 60 req/hour
- Authenticated: 5000 req/hour
- Update API handles limits
- Caches responses
- Returns cached if rate limited

## Performance

### Batch Checking

All skills checked in single API call:
- Reduces network overhead
- Single API rate limit cost
- Faster for multiple skills

### Parallel Updates

Updates run sequentially (not parallel):
- Easier to track progress
- Clearer error messages
- Less concurrent load

**Future:** Could parallelize with concurrency limit

## Telemetry

Update operations tracked anonymously:

```typescript
track({
  event: 'check',
  skillCount: String(skills.length),
  updatesFound: String(updates.length),
});

track({
  event: 'update',
  skillCount: String(updates.length),
  successCount: String(successCount),
  failCount: String(failCount),
});
```

No personal information collected.

## Future Enhancements

### Selective Updates

```bash
# Update specific skills only
aax update pr-review frontend-design

# Update by pattern
aax update --pattern "frontend-*"

# Interactive selection
aax update --interactive
```

### Version Pinning

```bash
# Pin to specific version
aax add skill pr-review@1.2.3 --pin

# Update but respect pins
aax update --respect-pins
```

### Update Notifications

```bash
# Check on every command (background)
aax config set auto-check-updates true

# Show notification if updates available
You have 2 skill updates available.
Run 'aax update' to install.
```

### Changelogs

```bash
# Show what changed
aax update --show-changes

# Review before updating
aax update --dry-run
```

## API Implementation

### Update Check Endpoint

```typescript
POST /check-updates

Request:
{
  skills: Array<{
    name: string;
    source: string;
    skillFolderHash: string;
  }>;
  forceRefresh?: boolean;
}

Response:
{
  updates: Array<{
    name: string;
    currentHash: string;
    latestHash: string;
    hasUpdate: boolean;
  }>;
}
```

### Hash Computation

```typescript
async function computeSkillHash(
  owner: string,
  repo: string,
  skillPath: string
): Promise<string> {
  // Get tree SHA for skill folder from GitHub
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/main:${skillPath}`
  );
  const data = await response.json();
  return data.sha;
}
```

## See Also

- [CLI Design](../architecture/cli-design.md) - Command structure
- [Lock Files](./lock-files.md) - Lock file formats
- [Telemetry](../design-decisions/telemetry.md) - Usage tracking
