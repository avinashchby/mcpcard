import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { scanDirectory } from '../../src/scan/scanner.js';

const TS_FIXTURE_DIR = join(__dirname, '../fixtures/sample-ts-server');
const PY_FIXTURE_DIR = join(__dirname, '../fixtures/sample-py-server');

describe('scanner', () => {
  it('scans sample-ts-server and returns valid ServerCard', async () => {
    const card = await scanDirectory(TS_FIXTURE_DIR);

    expect(card.name).toBe('test-server');
    expect(card.version).toBe('1.0.0');
    expect(card.capabilities.tools).toBe(true);
    expect(card.capabilities.resources).toBe(true);
    expect(card.capabilities.prompts).toBe(true);
    expect(card.tools).toHaveLength(2);
    expect(card.resources).toHaveLength(1);
    expect(card.prompts).toHaveLength(1);
    expect(card.transport?.type).toBe('stdio');
    expect(card.protocol_version).toBeDefined();
  });

  it('scans sample-py-server and returns valid ServerCard', async () => {
    const card = await scanDirectory(PY_FIXTURE_DIR);

    expect(card.name).toBe('python-test-server');
    expect(card.capabilities.tools).toBe(true);
    expect(card.capabilities.resources).toBe(true);
    expect(card.capabilities.prompts).toBe(true);
    expect(card.tools).toHaveLength(2);
    expect(card.resources).toHaveLength(1);
    expect(card.prompts).toHaveLength(1);
  });

  it('returns valid ServerCard with required fields', async () => {
    const card = await scanDirectory(TS_FIXTURE_DIR);

    expect(card).toHaveProperty('name');
    expect(card).toHaveProperty('version');
    expect(card).toHaveProperty('description');
    expect(card).toHaveProperty('capabilities');
    expect(card).toHaveProperty('protocol_version');
  });
});
