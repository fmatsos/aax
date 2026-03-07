import type { ResourceType } from './types.ts';

/**
 * Parse resource type from subcommand string.
 * Validates the resource type is one of the supported types.
 *
 * @param subcommand - The subcommand string (e.g., 'skill', 'mcp', 'hook')
 * @returns The validated resource type
 * @throws Error if subcommand is not a valid resource type
 */
export function parseResourceType(subcommand: string | undefined): ResourceType {
  if (!subcommand) {
    throw new Error(
      'Resource type is required. Use: skill, mcp, instruction, or hook\n' +
        'Examples:\n' +
        '  aax add skill <source>\n' +
        '  aax remove skill <name>\n' +
        '  aax list skill'
    );
  }

  const validTypes: ResourceType[] = ['skill', 'mcp', 'instruction', 'hook'];

  if (!validTypes.includes(subcommand as ResourceType)) {
    throw new Error(
      `Invalid resource type: '${subcommand}'\n` +
        `Valid types: ${validTypes.join(', ')}\n` +
        'Examples:\n' +
        '  aax add skill <source>\n' +
        '  aax remove mcp <name>\n' +
        '  aax list hook'
    );
  }

  return subcommand as ResourceType;
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
