# Telemetry Implementation

## Decision

Implement anonymous usage telemetry to understand how aax is being used and improve the tool based on real usage patterns.

## What We Collect

### Event Types

We track basic usage events:

```typescript
// Command usage
track({
  event: 'add',
  skillCount: '2',
  agents: 'claude-code,cursor',
  global: 'true',
});

track({
  event: 'remove',
  skillCount: '1',
});

track({
  event: 'list',
  agent: 'claude-code',
});

// Update operations
track({
  event: 'check',
  skillCount: '5',
  updatesFound: '2',
});

track({
  event: 'update',
  successCount: '2',
  failCount: '0',
});
```

### What We DON'T Collect

- **No personal information**: Names, emails, IPs
- **No file paths**: Your project structure
- **No skill content**: What's in your SKILL.md files
- **No repository URLs**: Where you install from
- **No credentials**: API keys, tokens

### Session Information

- **Anonymous ID**: Random UUID, not tied to you
- **CLI version**: To track adoption
- **Platform**: OS type (for compatibility)
- **CI detection**: Whether running in CI

## Implementation

### Code

```typescript
// src/telemetry.ts
import { PostHog } from 'posthog-node';

let client: PostHog | null = null;
let version: string = '0.0.0';
let isDisabled = false;

export function setVersion(v: string): void {
  version = v;
}

export function track(event: {
  event: string;
  [key: string]: string;
}): void {
  // Skip in CI
  if (isCI()) return;

  // Skip if disabled
  if (isDisabled || shouldDisableTelemetry()) {
    return;
  }

  // Initialize client lazily
  if (!client) {
    client = new PostHog(TELEMETRY_KEY, {
      host: 'https://app.posthog.com',
    });
  }

  // Track event
  client.capture({
    distinctId: getAnonymousId(),
    event: `aax.${event.event}`,
    properties: {
      ...event,
      version,
      platform: process.platform,
    },
  });
}
```

### Privacy Controls

Users can opt out via environment variables:

```bash
# Disable telemetry
export DISABLE_TELEMETRY=1
# or
export DO_NOT_TRACK=1
```

### CI Detection

Automatically disabled in CI environments:

```typescript
function isCI(): boolean {
  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.BUILD_NUMBER ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI
  );
}
```

## Rationale

### Why We Need It

1. **Usage Patterns**: Which commands are used most
2. **Error Rates**: How often operations fail
3. **Platform Support**: What OSes need better support
4. **Feature Adoption**: Are new features being used
5. **Version Distribution**: How fast users upgrade

### Why This Approach

1. **Anonymous**: No way to identify individuals
2. **Minimal**: Only essential metrics
3. **Transparent**: Open source, users can audit
4. **Opt-out**: Respects privacy preferences
5. **CI-aware**: Doesn't pollute CI metrics

## Use Cases

### Example Insights

**Command Usage:**
```
add: 70%
list: 15%
check: 8%
update: 5%
remove: 2%
```
→ Optimize `add` command experience

**Platform Distribution:**
```
macOS: 45%
Linux: 35%
Windows: 20%
```
→ Prioritize macOS/Linux testing

**Failure Rates:**
```
add success: 95%
add failure: 5%
```
→ Investigate common failure causes

**Version Adoption:**
```
v1.4.x: 60%
v1.3.x: 30%
v1.2.x: 10%
```
→ Know when safe to remove legacy support

## Data Retention

- **Storage**: PostHog (privacy-focused analytics)
- **Retention**: 90 days
- **Access**: Project maintainers only
- **Sharing**: Aggregate stats only, no raw data

## Alternative Considered

### No Telemetry

**Pros:**
- Perfect privacy
- No dependencies
- Simpler code

**Cons:**
- Blind development
- Can't measure impact
- Don't know what users need

**Decision:** Reject - Need insights to improve

### Full Analytics

**Pros:**
- Rich insights
- User journeys
- Error tracking

**Cons:**
- Privacy concerns
- Complexity
- Overkill for CLI

**Decision:** Reject - Too invasive

### Opt-in Telemetry

**Pros:**
- Explicit consent
- Best privacy

**Cons:**
- <5% participation rate
- Biased sample
- Not useful

**Decision:** Reject - Won't get enough data

## Implementation Details

### Anonymous ID

```typescript
function getAnonymousId(): string {
  const home = homedir();
  const configDir = join(home, '.agents');
  const idFile = join(configDir, '.telemetry-id');

  if (existsSync(idFile)) {
    return readFileSync(idFile, 'utf-8').trim();
  }

  // Generate new ID
  const id = randomUUID();
  mkdirSync(configDir, { recursive: true });
  writeFileSync(idFile, id);
  return id;
}
```

**Properties:**
- Random UUID v4
- Stored in `~/.agents/.telemetry-id`
- Same ID across sessions
- No correlation to user identity

### Event Structure

```typescript
interface TelemetryEvent {
  event: string;           // Event name (e.g., 'add', 'remove')
  [key: string]: string;   // Additional properties
}

// Example
{
  event: 'add',
  skillCount: '2',
  agents: 'claude-code',
  global: 'false',
  version: '1.4.3',
  platform: 'darwin',
}
```

### Error Handling

```typescript
export function track(event: TelemetryEvent): void {
  try {
    // ... tracking logic ...
  } catch (error) {
    // Fail silently - telemetry should never break CLI
    // No logs to avoid spam
  }
}
```

**Principle:** Telemetry failures are silent

## User Communication

### In Documentation

README includes:

```markdown
## Telemetry

This CLI collects anonymous usage data to help improve the tool.
No personal information is collected.

Telemetry is automatically disabled in CI environments.

To opt out:
- Set DISABLE_TELEMETRY=1
- Set DO_NOT_TRACK=1
```

### No Runtime Notices

We don't show telemetry notices during execution:
- Not first-time prompts
- Not on every command
- Users read docs or code

**Rationale:**
- CLI should be quiet
- Notices are annoying
- Documentation is sufficient

## Compliance

### GDPR

- **No personal data**: Nothing to protect
- **Anonymization**: Cannot identify users
- **Right to deletion**: Delete anonymous ID file

### California Privacy Law

- **No sale of data**: We don't sell anything
- **No personal information**: N/A

## Monitoring

### What We Watch

- Event volume trends
- Error rate spikes
- Version distribution
- Platform issues

### What We Don't

- Individual users
- Specific sessions
- Personal patterns

## Future Considerations

### Enhanced Events

Could add (still anonymous):
- Skill install success rate
- Common error types
- Performance metrics

### Opt-in Details

Could offer opt-in for:
- Error reports with stack traces
- Performance profiling
- Beta feature feedback

**Criteria for additional tracking:**
- Clear user benefit
- Remains anonymous
- Documented clearly

## Maintenance

### Review Schedule

- Quarterly: Review what we collect
- Annually: Audit for privacy
- Per release: Update event tracking

### Deprecation

When removing telemetry events:
1. Stop sending
2. Wait 90 days (retention period)
3. Remove code

## See Also

- [Contributing](../development/contributing.md) - Development workflow
- [Privacy Policy](https://aax.sh/privacy) - Full privacy policy
