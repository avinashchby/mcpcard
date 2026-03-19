import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { parsePyFile } from '../../src/scan/py-parser.js';

const FIXTURE_PATH = join(__dirname, '../fixtures/sample-py-server/server.py');

describe('py-parser', () => {
  it('extracts correct number of tools', async () => {
    const result = await parsePyFile(FIXTURE_PATH);
    expect(result.tools).toHaveLength(2);
  });

  it('extracts tool names and descriptions from docstrings', async () => {
    const result = await parsePyFile(FIXTURE_PATH);
    const names = result.tools.map((t) => t.name);
    expect(names).toContain('search_files');
    expect(names).toContain('read_file');

    const search = result.tools.find((t) => t.name === 'search_files');
    expect(search?.description).toBe(
      'Search for files matching a query pattern.',
    );

    const read = result.tools.find((t) => t.name === 'read_file');
    expect(read?.description).toBe(
      'Read the contents of a file at the given path.',
    );
  });

  it('extracts resource with URI', async () => {
    const result = await parsePyFile(FIXTURE_PATH);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].uri).toBe('config://app');
    expect(result.resources[0].name).toBe('get_config');
  });

  it('extracts prompt', async () => {
    const result = await parsePyFile(FIXTURE_PATH);
    expect(result.prompts).toHaveLength(1);
    expect(result.prompts[0].name).toBe('review_code');
    expect(result.prompts[0].description).toBe(
      'Generate a code review prompt.',
    );
  });

  it('extracts server name from FastMCP constructor', async () => {
    const result = await parsePyFile(FIXTURE_PATH);
    expect(result.serverName).toBe('python-test-server');
  });
});
