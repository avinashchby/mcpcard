import { describe, it, expect, afterEach } from 'vitest';
import { writeCard, formatOutputPath } from '../../src/card/card-writer.js';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { ServerCard } from '../../src/types/server-card.js';

const testCard: ServerCard = {
  name: 'test-server',
  version: '1.0.0',
  description: 'Test server',
  capabilities: { tools: false, resources: false, prompts: false },
  protocol_version: '2025-11-05',
};

/** Generate a unique temp directory path for each test. */
function tempDir(): string {
  return join(
    tmpdir(),
    `mcpcard-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
}

describe('card-writer', () => {
  const dirs: string[] = [];

  afterEach(async () => {
    for (const d of dirs) {
      await rm(d, { recursive: true, force: true }).catch(() => {});
    }
    dirs.length = 0;
  });

  describe('formatOutputPath', () => {
    it('produces .well-known/mcp/server-card.json by default', () => {
      const p = formatOutputPath('/project');
      expect(p).toBe(
        join('/project', '.well-known', 'mcp', 'server-card.json'),
      );
    });

    it('uses custom filename when provided', () => {
      const p = formatOutputPath('/project', 'custom.json');
      expect(p).toBe(
        join('/project', '.well-known', 'mcp', 'custom.json'),
      );
    });
  });

  describe('writeCard', () => {
    it('creates the file and parent directories', async () => {
      const dir = tempDir();
      dirs.push(dir);
      const outPath = join(dir, 'deep', 'nested', 'card.json');

      await writeCard(testCard, outPath);

      const content = await readFile(outPath, 'utf-8');
      expect(content).toBeTruthy();
    });

    it('writes valid JSON with 2-space indentation', async () => {
      const dir = tempDir();
      dirs.push(dir);
      const outPath = join(dir, 'card.json');

      await writeCard(testCard, outPath);

      const content = await readFile(outPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.name).toBe('test-server');
      // Check indentation: second line should start with 2 spaces
      const lines = content.split('\n');
      expect(lines[1].startsWith('  ')).toBe(true);
    });

    it('writes JSON that ends with a newline', async () => {
      const dir = tempDir();
      dirs.push(dir);
      const outPath = join(dir, 'card.json');

      await writeCard(testCard, outPath);

      const content = await readFile(outPath, 'utf-8');
      expect(content.endsWith('\n')).toBe(true);
    });
  });
});
