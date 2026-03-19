import { readFile } from 'node:fs/promises';
import { validateCard } from '../schema/schema-loader.js';
import type { ServerCard } from '../types/server-card.js';

/** Result of validating a server card file from disk. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  card?: ServerCard;
}

/** Read a JSON file from disk and parse it. */
async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as unknown;
}

/**
 * Validate a server card JSON file at the given path.
 * Handles file-not-found, malformed JSON, and schema validation errors
 * as distinct failure cases.
 */
export async function validateCardFile(
  filePath: string,
): Promise<ValidationResult> {
  let data: unknown;

  try {
    data = await readJsonFile(filePath);
  } catch (err: unknown) {
    return handleReadError(err, filePath);
  }

  const schemaResult = validateCard(data);

  if (!schemaResult.valid) {
    return { valid: false, errors: schemaResult.errors };
  }

  return {
    valid: true,
    errors: [],
    card: data as ServerCard,
  };
}

/** Map file-read errors to structured validation results. */
function handleReadError(
  err: unknown,
  filePath: string,
): ValidationResult {
  if (isNodeError(err) && err.code === 'ENOENT') {
    return {
      valid: false,
      errors: [`File not found: ${filePath}`],
    };
  }

  if (err instanceof SyntaxError) {
    return {
      valid: false,
      errors: [`Invalid JSON: ${err.message}`],
    };
  }

  const message = err instanceof Error ? err.message : String(err);
  return {
    valid: false,
    errors: [`Failed to read file: ${message}`],
  };
}

/** Type guard for Node.js system errors with a code property. */
function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
