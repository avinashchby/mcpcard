import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { validateCardFile } from '../../src/validate/validator.js';

const FIXTURES = join(import.meta.dirname, '..', 'fixtures');
const VALID_CARD = join(FIXTURES, 'valid-card.json');
const INVALID_CARD = join(FIXTURES, 'invalid-card.json');

describe('validateCardFile', () => {
  it('validates a valid card file', async () => {
    const result = await validateCardFile(VALID_CARD);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.card).toBeDefined();
    expect(result.card!.name).toBe('example-mcp-server');
  });

  it('catches an invalid card missing required fields', async () => {
    const result = await validateCardFile(INVALID_CARD);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.card).toBeUndefined();
  });

  it('handles non-existent file', async () => {
    const result = await validateCardFile('/tmp/does-not-exist-12345.json');

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('File not found');
  });

  it('handles malformed JSON', async () => {
    const dir = join(tmpdir(), `mcpcard-test-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const badFile = join(dir, 'bad.json');
    writeFileSync(badFile, '{ broken json ???', 'utf-8');

    try {
      const result = await validateCardFile(badFile);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid JSON');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
