import Ajv from 'ajv';
import type { ValidateFunction } from 'ajv';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/** Validation result returned by validateCard. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

let cachedValidator: ValidateFunction<unknown> | null = null;

/** Load the JSON schema from disk and return the raw object. */
function loadSchemaObject(): Record<string, unknown> {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const schemaPath = join(currentDir, 'server-card.schema.json');
  const raw = readFileSync(schemaPath, 'utf-8');
  return JSON.parse(raw) as Record<string, unknown>;
}

/** Create an Ajv instance handling CJS/ESM default export differences. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createAjv(): any {
  const AjvCtor = (Ajv as any).default ?? Ajv;
  return new AjvCtor({ allErrors: true });
}

/** Compile and cache the Ajv validator for the server card schema. */
function compileValidator(): ValidateFunction<unknown> {
  if (cachedValidator) {
    return cachedValidator;
  }
  const ajv = createAjv();
  const schema = loadSchemaObject();
  cachedValidator = ajv.compile(schema) as ValidateFunction<unknown>;
  return cachedValidator;
}

/** Get the compiled Ajv validator for the server card schema. */
export function getValidator(): ValidateFunction<unknown> {
  return compileValidator();
}

/**
 * Validate a candidate object against the server card schema.
 * Returns a result with validity flag and human-readable error strings.
 */
export function validateCard(card: unknown): ValidationResult {
  const validate = compileValidator();
  const valid = validate(card);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors = (validate.errors ?? []).map((err) => {
    const path = err.instancePath || '/';
    return `${path}: ${err.message ?? 'unknown error'}`;
  });

  return { valid: false, errors };
}
