import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { discoverFiles } from '../../src/scan/file-discovery.js';

/** Create a temporary directory for test isolation. */
async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'mcpcard-test-'));
}

describe('file-discovery', () => {
  it('finds .ts and .py files', async () => {
    const dir = await createTempDir();
    try {
      await writeFile(join(dir, 'server.ts'), 'export {}');
      await writeFile(join(dir, 'helper.py'), '# python');
      await writeFile(join(dir, 'main.js'), '// js');

      const files = await discoverFiles(dir);

      expect(files).toHaveLength(3);
      expect(files.some((f) => f.endsWith('server.ts'))).toBe(true);
      expect(files.some((f) => f.endsWith('helper.py'))).toBe(true);
      expect(files.some((f) => f.endsWith('main.js'))).toBe(true);
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it('excludes node_modules directory', async () => {
    const dir = await createTempDir();
    try {
      await writeFile(join(dir, 'index.ts'), 'export {}');
      await mkdir(join(dir, 'node_modules', 'pkg'), { recursive: true });
      await writeFile(join(dir, 'node_modules', 'pkg', 'index.ts'), '');

      const files = await discoverFiles(dir);

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('index.ts');
      expect(files[0]).not.toContain('node_modules');
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it('handles empty directory', async () => {
    const dir = await createTempDir();
    try {
      const files = await discoverFiles(dir);
      expect(files).toHaveLength(0);
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
