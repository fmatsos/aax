import type { ResourceType } from './types.ts';

/**
 * Get the resource type for a command operation.
 * Currently defaults to 'skill' as it's the only implemented resource type.
 * Future resource types (mcp, instruction, hook) will be added here.
 *
 * @param options - Command options that may specify resource type flags
 * @returns The resource type to operate on
 */
export function getResourceType(options?: unknown): ResourceType {
  // For now, we only support skills
  // In the future, this will check for --mcp, --instruction, --hook flags
  // and return the appropriate resource type
  // Example future logic:
  // if (options && typeof options === 'object' && 'mcp' in options) return 'mcp';
  // if (options && typeof options === 'object' && 'instruction' in options) return 'instruction';
  // if (options && typeof options === 'object' && 'hook' in options) return 'hook';

  // Default to 'skill' for backward compatibility
  return 'skill';
}

/**
 * Validates that a resource type is currently supported.
 * Throws an error if the resource type is not yet implemented.
 *
 * @param resourceType - The resource type to validate
 * @throws Error if resource type is not supported
 */
export function validateResourceType(resourceType: ResourceType): void {
  const supportedTypes: ResourceType[] = ['skill'];

  if (!supportedTypes.includes(resourceType)) {
    throw new Error(
      `Resource type '${resourceType}' is not yet supported. Currently supported: ${supportedTypes.join(', ')}`
    );
  }
}

/**
 * Gets a human-readable display name for a resource type.
 *
 * @param resourceType - The resource type
 * @returns Display name for the resource type
 */
export function getResourceTypeDisplayName(resourceType: ResourceType): string {
  const displayNames: Record<ResourceType, string> = {
    skill: 'skill',
    mcp: 'MCP server',
    instruction: 'instruction',
    hook: 'hook',
  };

  return displayNames[resourceType] || resourceType;
}

/**
 * Gets the plural form of a resource type display name.
 *
 * @param resourceType - The resource type
 * @returns Plural display name for the resource type
 */
export function getResourceTypePluralName(resourceType: ResourceType): string {
  const pluralNames: Record<ResourceType, string> = {
    skill: 'skills',
    mcp: 'MCP servers',
    instruction: 'instructions',
    hook: 'hooks',
  };

  return pluralNames[resourceType] || `${resourceType}s`;
}
