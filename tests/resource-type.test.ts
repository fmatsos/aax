import { describe, it, expect } from 'vitest';
import {
  parseResourceType,
  validateResourceType,
  getResourceTypeDisplayName,
  getResourceTypePluralName,
} from '../src/resource-type.ts';
import type { ResourceType } from '../src/types.ts';

describe('resource-type utilities', () => {
  describe('parseResourceType', () => {
    it('should parse and return skill resource type', () => {
      const result = parseResourceType('skill');
      expect(result).toBe('skill');
    });

    it('should parse and return mcp resource type', () => {
      const result = parseResourceType('mcp');
      expect(result).toBe('mcp');
    });

    it('should parse and return instruction resource type', () => {
      const result = parseResourceType('instruction');
      expect(result).toBe('instruction');
    });

    it('should parse and return hook resource type', () => {
      const result = parseResourceType('hook');
      expect(result).toBe('hook');
    });

    it('should throw error for undefined subcommand', () => {
      expect(() => parseResourceType(undefined)).toThrow('Resource type is required');
    });

    it('should throw error for invalid resource type', () => {
      expect(() => parseResourceType('invalid')).toThrow("Invalid resource type: 'invalid'");
    });

    it('should throw error for empty string', () => {
      expect(() => parseResourceType('')).toThrow('Resource type is required');
    });
  });

  describe('validateResourceType', () => {
    it('should not throw for skill resource type', () => {
      expect(() => validateResourceType('skill')).not.toThrow();
    });

    it('should throw for mcp resource type (not yet supported)', () => {
      expect(() => validateResourceType('mcp')).toThrow(
        "Resource type 'mcp' is not yet supported. Currently supported: skill"
      );
    });

    it('should throw for instruction resource type (not yet supported)', () => {
      expect(() => validateResourceType('instruction')).toThrow(
        "Resource type 'instruction' is not yet supported. Currently supported: skill"
      );
    });

    it('should throw for hook resource type (not yet supported)', () => {
      expect(() => validateResourceType('hook')).toThrow(
        "Resource type 'hook' is not yet supported. Currently supported: skill"
      );
    });
  });

  describe('getResourceTypeDisplayName', () => {
    it('should return correct display name for skill', () => {
      expect(getResourceTypeDisplayName('skill')).toBe('skill');
    });

    it('should return correct display name for mcp', () => {
      expect(getResourceTypeDisplayName('mcp')).toBe('MCP server');
    });

    it('should return correct display name for instruction', () => {
      expect(getResourceTypeDisplayName('instruction')).toBe('instruction');
    });

    it('should return correct display name for hook', () => {
      expect(getResourceTypeDisplayName('hook')).toBe('hook');
    });
  });

  describe('getResourceTypePluralName', () => {
    it('should return correct plural name for skill', () => {
      expect(getResourceTypePluralName('skill')).toBe('skills');
    });

    it('should return correct plural name for mcp', () => {
      expect(getResourceTypePluralName('mcp')).toBe('MCP servers');
    });

    it('should return correct plural name for instruction', () => {
      expect(getResourceTypePluralName('instruction')).toBe('instructions');
    });

    it('should return correct plural name for hook', () => {
      expect(getResourceTypePluralName('hook')).toBe('hooks');
    });
  });

  describe('future resource type extensibility', () => {
    it('should have all future resource types defined in ResourceType', () => {
      const futureTypes: ResourceType[] = ['skill', 'mcp', 'instruction', 'hook'];
      // This test verifies that the type system knows about all planned resource types
      expect(futureTypes).toHaveLength(4);
    });
  });
});
