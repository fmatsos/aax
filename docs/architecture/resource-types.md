# Resource Type Architecture

## Overview

The `aax` CLI has been architected to support multiple resource types beyond just skills. This document explains the resource type abstraction layer that enables future support for MCP servers, instructions, hooks, and other resource types.

## Resource Types

Currently defined resource types:

```typescript
export type ResourceType = 'skill' | 'mcp' | 'instruction' | 'hook';
```

### Current Support

- ✅ **skill**: Fully implemented and supported
- 🚧 **mcp**: Planned for future release
- 🚧 **instruction**: Planned for future release
- 🚧 **hook**: Planned for future release

## Core Module: `src/resource-type.ts`

This module provides utility functions for working with resource types:

### `parseResourceType(subcommand)`

Determines the resource type from the CLI subcommand position.

```typescript
// Parse resource type from subcommand
const resourceType = parseResourceType('skill');
// Returns: 'skill'

// Validates and throws error if invalid
parseResourceType('invalid');
// Throws: "Resource type is required. Use: skill, mcp, instruction, or hook"
```

### `validateResourceType(resourceType)`

Validates that a resource type is currently supported. Throws an error for unsupported types.

```typescript
validateResourceType('skill');  // ✅ OK
validateResourceType('mcp');    // ❌ Throws: "Resource type 'mcp' is not yet supported"
```

### `getResourceTypeDisplayName(resourceType)`

Returns human-readable display names:

```typescript
getResourceTypeDisplayName('skill')       // 'skill'
getResourceTypeDisplayName('mcp')         // 'MCP server'
getResourceTypeDisplayName('instruction') // 'instruction'
getResourceTypeDisplayName('hook')        // 'hook'
```

### `getResourceTypePluralName(resourceType)`

Returns plural forms for display:

```typescript
getResourceTypePluralName('skill')       // 'skills'
getResourceTypePluralName('mcp')         // 'MCP servers'
getResourceTypePluralName('instruction') // 'instructions'
getResourceTypePluralName('hook')        // 'hooks'
```

## Command Integration

All main commands use resource type validation through a consistent pattern:

### Add Command

```typescript
export async function runAdd(args: string[], options: AddOptions = {}): Promise<void> {
  // Parse and validate resource type from subcommand
  const resourceType = parseResourceType(options._resourceType);
  validateResourceType(resourceType);

  // Continue with command logic...
}
```

### Remove Command

```typescript
export async function removeCommand(skillNames: string[], options: RemoveOptions) {
  // Parse and validate resource type
  const resourceType = parseResourceType(options._resourceType);
  validateResourceType(resourceType);

  // Continue with command logic...
}
```

### List Command

```typescript
export async function runList(args: string[], resourceTypeArg?: string): Promise<void> {
  // Parse and validate resource type
  const resourceType = parseResourceType(resourceTypeArg);
  validateResourceType(resourceType);

  // Continue with command logic...
}
```

## Design Principles

### SOLID Principles

1. **Single Responsibility Principle (SRP)**
   - `resource-type.ts` is solely responsible for resource type operations
   - Each function has a single, well-defined purpose

2. **Open/Closed Principle (OCP)**
   - Architecture is open for extension (new resource types)
   - Closed for modification (no need to change existing command logic)

3. **Liskov Substitution Principle (LSP)**
   - All resource types can be substituted transparently
   - Commands work with any valid ResourceType

4. **Interface Segregation Principle (ISP)**
   - Clean, minimal interfaces for resource type operations
   - No unnecessary dependencies

5. **Dependency Inversion Principle (DIP)**
   - Commands depend on ResourceType abstraction
   - Not on concrete implementations

### Clean Code Practices

- **Descriptive Names**: Function names clearly describe their purpose
- **DRY (Don't Repeat Yourself)**: Validation logic centralized
- **Type Safety**: Full TypeScript type checking
- **Documentation**: Comprehensive JSDoc comments
- **Testing**: 100% test coverage with dedicated tests

### 12-Factor Methodology

- **Configuration**: Resource type configuration in code, easily extensible
- **Dependencies**: Explicit dependencies through TypeScript types
- **Disposability**: Clean separation of concerns for easy maintenance

## Future Extensibility

### Adding a New Resource Type

To add support for a new resource type (e.g., MCP):

1. **Update Validation** in `src/resource-type.ts`:
   ```typescript
   export function validateResourceType(resourceType: ResourceType): void {
     const supportedTypes: ResourceType[] = ['skill', 'mcp']; // Add 'mcp'
     // ...
   }
   ```

2. **Implement Resource-Specific Logic** in command handlers as needed

3. **Add Tests** for the new resource type

### Example Future Commands

```bash
# MCP Servers
aax add mcp <source> [names...]
aax remove mcp <names...>
aax list mcp

# Instructions
aax add instruction <source> [names...]
aax remove instruction <names...>
aax list instruction

# Hooks
aax add hook <source> [names...]
aax remove hook <names...>
aax list hook
```

## Testing

The resource type system includes comprehensive tests (`tests/resource-type.test.ts`):

- ✅ Default resource type behavior
- ✅ Validation of supported types
- ✅ Error handling for unsupported types
- ✅ Display name utilities
- ✅ Plural name utilities
- ✅ Future extensibility verification

## Migration Path

For future resource types:

1. **Phase 1**: Define the resource type in `types.ts` ✅ (Done)
2. **Phase 2**: Add validation and utilities ✅ (Done)
3. **Phase 3**: Integrate into commands ✅ (Done)
4. **Phase 4**: Add tests ✅ (Done)
5. **Phase 5**: Implement resource-specific logic (Future)
6. **Phase 6**: Update documentation (Future)

## See Also

- [CLI Design](./cli-design.md) - Command-line interface structure
- [Positional Arguments](./positional-arguments.md) - Resource name arguments
- [Subcommand-based CLI](../design-decisions/subcommand-based-cli.md) - Design rationale
