import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ServerCard } from '../types/server-card.js';

/** Default filename for server card output. */
const DEFAULT_FILENAME = 'server-card.json';

/** Default subdirectory path for well-known location. */
const WELL_KNOWN_DIR = '.well-known/mcp';

/**
 * Format the full output path for a server card file.
 * Defaults to .well-known/mcp/server-card.json inside the given directory.
 */
export function formatOutputPath(
  dir: string,
  filename?: string,
): string {
  return join(dir, WELL_KNOWN_DIR, filename ?? DEFAULT_FILENAME);
}

/**
 * Write a server card to disk as pretty-printed JSON.
 * Creates parent directories if they don't exist.
 */
export async function writeCard(
  card: ServerCard,
  outputPath: string,
): Promise<void> {
  const dir = dirname(outputPath);
  await mkdir(dir, { recursive: true });
  const json = JSON.stringify(card, null, 2) + '\n';
  await writeFile(outputPath, json, 'utf-8');
}
