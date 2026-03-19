import { describe, it, expect } from 'vitest';
import {
  discoverAgents,
  discoverAgentFrontmatters,
  groupAgentsByCliTool,
  generateAgentContent,
} from '../src/agents-resource.ts';
import type { Agent, AgentFrontmatter } from '../src/types.ts';

describe('agents-resource', () => {
  describe('groupAgentsByCliTool', () => {
    it('should group agents by CLI tool based on frontmatters', () => {
      const agents: Agent[] = [
        {
          name: 'explorer',
          description: 'Explores code',
          path: '/test/agents/explorer.md',
          rawContent: 'Explorer agent content',
          metadata: { name: 'explorer', description: 'Explores code' },
        },
        {
          name: 'reviewer',
          description: 'Reviews code',
          path: '/test/agents/reviewer.md',
          rawContent: 'Reviewer agent content',
          metadata: { name: 'reviewer', description: 'Reviews code' },
        },
      ];

      const frontmatters: AgentFrontmatter[] = [
        {
          cliTool: 'claude',
          agentName: 'explorer',
          path: '/test/claude/agents/explorer.yaml',
          frontmatter: { model: 'claude-3' },
        },
        {
          cliTool: 'copilot',
          agentName: 'explorer',
          path: '/test/copilot/agents/explorer.yaml',
          frontmatter: { model: 'gpt-4' },
        },
        {
          cliTool: 'claude',
          agentName: 'reviewer',
          path: '/test/claude/agents/reviewer.yaml',
          frontmatter: { model: 'claude-3' },
        },
      ];

      const groups = groupAgentsByCliTool(agents, frontmatters);

      expect(groups.size).toBe(2);
      expect(groups.get('claude')).toEqual(['explorer', 'reviewer']);
      expect(groups.get('copilot')).toEqual(['explorer']);
    });

    it('should only include agents that exist', () => {
      const agents: Agent[] = [
        {
          name: 'explorer',
          description: 'Explores code',
          path: '/test/agents/explorer.md',
          rawContent: 'Explorer agent content',
          metadata: { name: 'explorer', description: 'Explores code' },
        },
      ];

      const frontmatters: AgentFrontmatter[] = [
        {
          cliTool: 'claude',
          agentName: 'explorer',
          path: '/test/claude/agents/explorer.yaml',
          frontmatter: { model: 'claude-3' },
        },
        {
          cliTool: 'claude',
          agentName: 'nonexistent',
          path: '/test/claude/agents/nonexistent.yaml',
          frontmatter: { model: 'claude-3' },
        },
      ];

      const groups = groupAgentsByCliTool(agents, frontmatters);

      expect(groups.size).toBe(1);
      expect(groups.get('claude')).toEqual(['explorer']);
    });
  });

  describe('generateAgentContent', () => {
    it('should generate agent content with merged frontmatter', () => {
      const agent: Agent = {
        name: 'explorer',
        description: 'Explores code',
        path: '/test/agents/explorer.md',
        rawContent: 'Explorer agent instructions\n\nStep 1: Do something',
        metadata: {
          name: 'explorer',
          description: 'Explores code',
          version: '1.0',
        },
      };

      const frontmatter: AgentFrontmatter = {
        cliTool: 'claude',
        agentName: 'explorer',
        path: '/test/claude/agents/explorer.yaml',
        frontmatter: {
          model: 'claude-3',
          temperature: 0.7,
        },
      };

      const content = generateAgentContent(agent, frontmatter);

      // Should contain merged frontmatter
      expect(content).toContain('name: explorer');
      expect(content).toContain('description: Explores code');
      expect(content).toContain("version: '1.0'");
      expect(content).toContain('model: claude-3');
      expect(content).toContain('temperature: 0.7');

      // Should contain the body
      expect(content).toContain('Explorer agent instructions');
      expect(content).toContain('Step 1: Do something');
    });

    it('should generate agent content without additional frontmatter', () => {
      const agent: Agent = {
        name: 'reviewer',
        description: 'Reviews code',
        path: '/test/agents/reviewer.md',
        rawContent: 'Reviewer instructions',
        metadata: {
          name: 'reviewer',
          description: 'Reviews code',
        },
      };

      const content = generateAgentContent(agent);

      // Should contain original frontmatter
      expect(content).toContain('name: reviewer');
      expect(content).toContain('description: Reviews code');

      // Should contain the body
      expect(content).toContain('Reviewer instructions');
    });
  });
});
