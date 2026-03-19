/**
 * mcpcard CLI entry point and public API.
 * Generate, validate, and serve MCP Server Cards per SEP-1649.
 */

import { Command } from 'commander';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { setLogLevel, info, error as logError } from './utils/logger.js';
import { validateCardFile } from './validate/validator.js';
import { startServer } from './serve/server.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

const program = new Command();

program
  .name('mcpcard')
  .version(pkg.version)
  .description('Generate MCP Server Cards per SEP-1649');

/** Apply verbose flag by setting the global log level. */
function applyVerbose(opts: { verbose?: boolean }): void {
  if (opts.verbose) {
    setLogLevel('verbose');
  }
}

registerScanCommand();
registerLiveCommand();
registerValidateCommand();
registerServeCommand();

/** Only parse CLI args when run as a script, not when imported as a library. */
const isDirectExecution = process.argv[1]?.includes('mcpcard');
if (isDirectExecution) {
  program.parse();
}

/** Register the scan command. */
function registerScanCommand(): void {
  program
    .command('scan <dir>')
    .description('Scan source directory to generate a server card')
    .option('-o, --output <path>', 'Output path', '.well-known/mcp/server-card.json')
    .option('-v, --verbose', 'Enable verbose logging')
    .action(async (dir: string, opts: { output: string; verbose?: boolean }) => {
      applyVerbose(opts);
      await runScan(dir, opts.output);
    });
}

/** Execute the scan workflow. */
async function runScan(dir: string, output: string): Promise<void> {
  try {
    const { scanDirectory } = await import('./scan/scanner.js');
    const card = await scanDirectory(resolve(dir));
    const { writeCard } = await import('./card/card-writer.js');
    await writeCard(card, resolve(output));
    info(`Card written to ${resolve(output)}`);
  } catch (err) {
    logError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

/** Register the live command. */
function registerLiveCommand(): void {
  program
    .command('live')
    .description('Introspect a running MCP server to generate a card')
    .option('-c, --command <cmd>', 'stdio command string')
    .option('-u, --url <url>', 'HTTP URL of the MCP server')
    .option('-o, --output <path>', 'Output path', '.well-known/mcp/server-card.json')
    .option('-v, --verbose', 'Enable verbose logging')
    .action(async (opts: {
      command?: string;
      url?: string;
      output: string;
      verbose?: boolean;
    }) => {
      applyVerbose(opts);
      await runLive(opts);
    });
}

/** Execute the live introspection workflow. */
async function runLive(opts: {
  command?: string;
  url?: string;
  output: string;
}): Promise<void> {
  if ((!opts.command && !opts.url) || (opts.command && opts.url)) {
    logError('Provide exactly one of --command or --url');
    process.exit(1);
  }

  try {
    const { introspectViaStdio, introspectViaHttp } = await import(
      './live/introspector.js'
    );
    const { writeCard } = await import('./card/card-writer.js');
    let card;

    if (opts.command) {
      const parts = opts.command.split(' ');
      card = await introspectViaStdio(parts[0], parts.slice(1));
    } else {
      card = await introspectViaHttp(opts.url!);
    }

    await writeCard(card, resolve(opts.output));
    info(`Card written to ${resolve(opts.output)}`);
  } catch (err) {
    logError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

/** Register the validate command. */
function registerValidateCommand(): void {
  program
    .command('validate <path>')
    .description('Validate a server card JSON file')
    .action(async (cardPath: string) => {
      await runValidate(cardPath);
    });
}

/** Execute the validate workflow. */
async function runValidate(cardPath: string): Promise<void> {
  const result = await validateCardFile(resolve(cardPath));

  if (result.valid) {
    info('Card is valid.');
    process.exit(0);
  }

  logError('Card validation failed:');
  for (const msg of result.errors) {
    logError(`  - ${msg}`);
  }
  process.exit(1);
}

/** Register the serve command. */
function registerServeCommand(): void {
  program
    .command('serve <path>')
    .description('Serve a server card over HTTP')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .action(async (cardPath: string, opts: { port: string }) => {
      await runServe(cardPath, parseInt(opts.port, 10));
    });
}

/** Execute the serve workflow: validate first, then start server. */
async function runServe(
  cardPath: string,
  port: number,
): Promise<void> {
  const result = await validateCardFile(resolve(cardPath));

  if (!result.valid) {
    logError('Card validation failed — refusing to serve:');
    for (const msg of result.errors) {
      logError(`  - ${msg}`);
    }
    process.exit(1);
  }

  try {
    await startServer(resolve(cardPath), port);
  } catch (err) {
    logError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

/* ---- Public API re-exports for library consumers ---- */

export { mcpCardMiddleware } from './serve/middleware.js';
export { validateCard, getValidator } from './schema/schema-loader.js';
export { buildCard } from './card/card-builder.js';
export type { CardBuildOptions } from './card/card-builder.js';
export { validateCardFile } from './validate/validator.js';
export type { ValidationResult } from './validate/validator.js';
export { startServer } from './serve/server.js';
export type { ServerHandle } from './serve/server.js';
export { writeCard, formatOutputPath } from './card/card-writer.js';
export {
  McpCardError,
  ScanError,
  LiveError,
  ValidationError,
  ServeError,
} from './utils/errors.js';
export { setLogLevel, info, warn, error, verbose } from './utils/logger.js';
export type { LogLevel } from './utils/logger.js';
export type {
  ServerCard,
  McpTool,
  McpResource,
  McpPrompt,
  PromptArgument,
  Transport,
  Authentication,
  Capabilities,
} from './types/server-card.js';
export { discoverFiles } from './scan/file-discovery.js';
export { scanDirectory } from './scan/scanner.js';
export {
  introspectServer,
  introspectViaStdio,
  introspectViaHttp,
} from './live/introspector.js';
