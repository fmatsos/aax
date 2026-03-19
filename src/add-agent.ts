import * as p from '@clack/prompts';
import pc from 'picocolors';
import { existsSync } from 'fs';
import type { AddOptions } from './add.ts';
import { parseSource } from './source-parser.ts';
import { cloneRepo, cleanupTempDir, GitCloneError } from './git.ts';
import {
  discoverAgents,
  discoverAgentFrontmatters,
  groupAgentsByCliTool,
} from './agents-resource.ts';
import { installAgentForCli } from './agent-installer.ts';

/**
 * Handle `aax add subagent <source>` command (alias: agent).
 * Discovers agents and their CLI-specific frontmatters, then installs them.
 */
export async function runAddAgent(source: string, options: AddOptions = {}): Promise<void> {
  console.log();
  p.intro(pc.bgCyan(pc.black(' agents ')));

  let tempDir: string | null = null;

  try {
    const spinner = p.spinner();

    spinner.start('Parsing source...');
    const parsed = parseSource(source);
    spinner.stop(
      `Source: ${parsed.type === 'local' ? parsed.localPath! : parsed.url}${parsed.ref ? ` @ ${pc.yellow(parsed.ref)}` : ''}${parsed.subpath ? ` (${parsed.subpath})` : ''}`
    );

    let agentsDir: string;

    if (parsed.type === 'local') {
      // Use local path directly, no cloning needed
      spinner.start('Validating local path...');
      if (!existsSync(parsed.localPath!)) {
        spinner.stop(pc.red('Path not found'));
        p.outro(pc.red(`Local path does not exist: ${parsed.localPath}`));
        process.exit(1);
      }
      agentsDir = parsed.localPath!;
      spinner.stop('Local path validated');
    } else {
      // Clone repository for remote sources
      spinner.start('Cloning repository...');
      tempDir = await cloneRepo(parsed.url, parsed.ref);
      agentsDir = tempDir;
      spinner.stop('Repository cloned');
    }

    spinner.start('Discovering agents...');
    const agents = await discoverAgents(agentsDir, parsed.subpath);

    if (agents.length === 0) {
      spinner.stop(pc.red('No agents found'));
      p.outro(
        pc.red(
          'No valid agents found. Agent .md files require name and description in frontmatter.'
        )
      );
      await cleanup(tempDir);
      process.exit(1);
    }

    spinner.stop(`Found ${pc.green(agents.length)} agent${agents.length > 1 ? 's' : ''}`);

    // Discover CLI-specific frontmatters
    spinner.start('Discovering CLI frontmatters...');
    const frontmatters = await discoverAgentFrontmatters(agentsDir, parsed.subpath);

    if (frontmatters.length === 0) {
      spinner.stop(pc.red('No CLI frontmatters found'));
      p.outro(
        pc.red(
          'No CLI-specific frontmatters found. Frontmatters should be in <cli-tool>/agents/*.yaml files.'
        )
      );
      await cleanup(tempDir);
      process.exit(1);
    }

    spinner.stop(`Found frontmatters for ${pc.green(frontmatters.length)} agent(s)`);

    // Group agents by CLI tool
    const agentsByCliTool = groupAgentsByCliTool(agents, frontmatters);

    if (options.list) {
      console.log();
      p.log.step(pc.bold('Available Agents by CLI Tool'));
      console.log();

      for (const [cliTool, agentNames] of agentsByCliTool) {
        console.log(pc.bold(`${cliTool}:`));
        for (const agentName of agentNames) {
          const agent = agents.find((a) => a.name === agentName);
          if (agent) {
            p.log.message(`  ${pc.cyan(agent.name)}`);
            p.log.message(`    ${pc.dim(agent.description)}`);
          }
        }
        console.log();
      }

      p.outro('Use --agent <cli-tool> to install for specific CLI tools');
      await cleanup(tempDir);
      process.exit(0);
    }

    // For now, let's install all agents for all available CLI tools
    // TODO: Add filtering by --agent option and interactive selection

    console.log();
    p.log.info('Installing agents...');

    const results: Array<{
      agentName: string;
      cliTool: string;
      success: boolean;
      path?: string;
      error?: string;
    }> = [];

    for (const agent of agents) {
      for (const [cliTool, agentNames] of agentsByCliTool) {
        if (agentNames.includes(agent.name)) {
          const cliToolFrontmatters = frontmatters.filter(
            (fm) => fm.cliTool === cliTool && fm.agentName === agent.name
          );

          const result = await installAgentForCli(agent, cliTool, cliToolFrontmatters, {
            global: options.global,
            multiCli: agentsByCliTool.size > 1,
          });

          results.push({
            agentName: agent.name,
            cliTool,
            success: result.success,
            path: result.path,
            error: result.error,
          });
        }
      }
    }

    console.log();
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (successful.length > 0) {
      p.log.success(pc.green(`Installed ${successful.length} agent(s)`));
      for (const r of successful) {
        p.log.message(`  ${pc.green('✓')} ${r.agentName} → ${r.cliTool}`);
        if (r.path) {
          p.log.message(`    ${pc.dim(r.path)}`);
        }
      }
    }

    if (failed.length > 0) {
      console.log();
      p.log.error(pc.red(`Failed to install ${failed.length} agent(s)`));
      for (const r of failed) {
        p.log.message(`  ${pc.red('✗')} ${r.agentName} → ${r.cliTool}: ${pc.dim(r.error)}`);
      }
    }

    console.log();
    p.outro(
      pc.green('Done!') +
        pc.dim('  Review agents before use; they run with full CLI tool permissions.')
    );
  } catch (error) {
    if (error instanceof GitCloneError) {
      p.log.error(pc.red('Failed to clone repository'));
      for (const line of error.message.split('\n')) {
        p.log.message(pc.dim(line));
      }
    } else {
      p.log.error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
    p.outro(pc.red('Installation failed'));
    process.exit(1);
  } finally {
    await cleanup(tempDir);
  }
}

// Cleanup helper
async function cleanup(tempDir: string | null) {
  if (tempDir) {
    try {
      await cleanupTempDir(tempDir);
    } catch {
      // Ignore cleanup errors
    }
  }
}
