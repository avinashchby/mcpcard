import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type { ServerCard } from '../types/server-card.js';
import type { ParsedServer } from './ts-parser.js';
import { emptyParsedServer, parseTsFile } from './ts-parser.js';
import { parsePyFile } from './py-parser.js';
import { discoverFiles } from './file-discovery.js';
import { buildCard } from '../card/card-builder.js';
import { verbose } from '../utils/logger.js';

/** Shape of relevant fields from package.json. */
interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
}

/** File extensions that route to the TypeScript parser. */
const TS_EXTENSIONS = new Set(['.ts', '.js']);

/** File extensions that route to the Python parser. */
const PY_EXTENSIONS = new Set(['.py']);

/**
 * Parse a single file, routing to the correct parser by extension.
 * Returns an empty result for unsupported extensions.
 */
async function parseFile(filePath: string): Promise<ParsedServer> {
  const ext = extname(filePath).toLowerCase();

  if (TS_EXTENSIONS.has(ext)) {
    return parseTsFile(filePath);
  }
  if (PY_EXTENSIONS.has(ext)) {
    return parsePyFile(filePath);
  }

  return emptyParsedServer();
}

/**
 * Merge multiple ParsedServer results into a single accumulated result.
 * Concatenates all tools, resources, prompts. Uses the first non-undefined
 * value found for transport, serverName, and serverVersion.
 */
function mergeResults(results: ParsedServer[]): ParsedServer {
  const merged = emptyParsedServer();

  for (const r of results) {
    merged.tools.push(...r.tools);
    merged.resources.push(...r.resources);
    merged.prompts.push(...r.prompts);
    if (!merged.transport && r.transport) merged.transport = r.transport;
    if (!merged.serverName && r.serverName) merged.serverName = r.serverName;
    if (!merged.serverVersion && r.serverVersion) {
      merged.serverVersion = r.serverVersion;
    }
  }

  return merged;
}

/**
 * Attempt to read and parse a package.json from the given directory.
 * Returns undefined if the file does not exist or cannot be parsed.
 */
async function readPackageJson(
  dir: string,
): Promise<PackageJson | undefined> {
  try {
    const raw = await readFile(join(dir, 'package.json'), 'utf-8');
    return JSON.parse(raw) as PackageJson;
  } catch {
    return undefined;
  }
}

/**
 * Determine the server name from parsed results and package.json.
 * Priority: parsed server name > package.json name > directory basename.
 */
function resolveServerName(
  merged: ParsedServer,
  pkg: PackageJson | undefined,
  dir: string,
): string {
  if (merged.serverName) return merged.serverName;
  if (pkg?.name) return pkg.name;
  return dir.split('/').pop() ?? 'unknown';
}

/**
 * Scan a directory for MCP server source files, parse them all,
 * and build a complete ServerCard from the aggregated results.
 * Also reads package.json for name/version/description metadata.
 */
export async function scanDirectory(dir: string): Promise<ServerCard> {
  const files = await discoverFiles(dir);
  verbose(`Discovered ${files.length} source files`);

  const results = await Promise.all(files.map(parseFile));
  const merged = mergeResults(results);
  const pkg = await readPackageJson(dir);

  const name = resolveServerName(merged, pkg, dir);
  const version = merged.serverVersion ?? pkg?.version;
  const description = pkg?.description;

  return buildCard({
    name,
    version,
    description,
    transport: merged.transport,
    tools: merged.tools.length > 0 ? merged.tools : undefined,
    resources: merged.resources.length > 0 ? merged.resources : undefined,
    prompts: merged.prompts.length > 0 ? merged.prompts : undefined,
  });
}
