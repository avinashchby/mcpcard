import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { parseTsFile } from '../../src/scan/ts-parser.js';

const FIXTURE_PATH = join(__dirname, '../fixtures/sample-ts-server/index.ts');

describe('ts-parser', () => {
  it('extracts correct number of tools', async () => {
    const result = await parseTsFile(FIXTURE_PATH);
    expect(result.tools).toHaveLength(2);
  });

  it('extracts tool names and descriptions', async () => {
    const result = await parseTsFile(FIXTURE_PATH);
    const names = result.tools.map((t) => t.name);
    expect(names).toContain('search_issues');
    expect(names).toContain('create_issue');

    const search = result.tools.find((t) => t.name === 'search_issues');
    expect(search?.description).toBe('Search GitHub issues');

    const create = result.tools.find((t) => t.name === 'create_issue');
    expect(create?.description).toBe('Create a new issue');
  });

  it('extracts resource', async () => {
    const result = await parseTsFile(FIXTURE_PATH);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].uri).toBe('repo://main/readme');
  });

  it('extracts prompt', async () => {
    const result = await parseTsFile(FIXTURE_PATH);
    expect(result.prompts).toHaveLength(1);
    expect(result.prompts[0].name).toBe('summarize');
    expect(result.prompts[0].description).toBe('Summarize an issue');
  });

  it('detects StdioServerTransport', async () => {
    const result = await parseTsFile(FIXTURE_PATH);
    expect(result.transport).toBeDefined();
    expect(result.transport?.type).toBe('stdio');
  });

  it('extracts server name and version', async () => {
    const result = await parseTsFile(FIXTURE_PATH);
    expect(result.serverName).toBe('test-server');
    expect(result.serverVersion).toBe('1.0.0');
  });
});
