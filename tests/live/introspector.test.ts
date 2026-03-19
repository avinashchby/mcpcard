import { describe, it, expect } from 'vitest';
import { introspectServer } from '../../src/live/introspector.js';
import type { McpClientConnection } from '../../src/live/types.js';
import type { ServerCard } from '../../src/types/server-card.js';

/** Create a mock MCP client connection with known fixture data. */
function createMockConnection(options?: {
  serverName?: string;
  serverVersion?: string;
  tools?: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>;
  resources?: Array<{ uri: string; name: string; description?: string; mimeType?: string }>;
  prompts?: Array<{ name: string; description?: string; arguments?: Array<{ name: string }> }>;
}): McpClientConnection {
  const {
    serverName = 'mock-server',
    serverVersion = '2.0.0',
    tools = [],
    resources = [],
    prompts = [],
  } = options ?? {};

  const mockClient = {
    getServerVersion: () => ({ name: serverName, version: serverVersion }),
    getServerCapabilities: () => ({
      tools: tools.length > 0 ? {} : undefined,
      resources: resources.length > 0 ? {} : undefined,
      prompts: prompts.length > 0 ? {} : undefined,
    }),
    listTools: async () => ({ tools }),
    listResources: async () => ({ resources }),
    listPrompts: async () => ({ prompts }),
  };

  return {
    client: mockClient as unknown as McpClientConnection['client'],
    close: async () => {},
  };
}

describe('introspector', () => {
  it('exports introspectServer function', () => {
    expect(typeof introspectServer).toBe('function');
  });

  it('returns a valid ServerCard from mock data', async () => {
    const connection = createMockConnection({
      tools: [{ name: 'mock_tool', description: 'A mock tool', inputSchema: { type: 'object' } }],
      resources: [{ uri: 'mock://resource', name: 'mock_resource' }],
      prompts: [{ name: 'mock_prompt', description: 'A mock prompt' }],
    });

    const card: ServerCard = await introspectServer(connection);

    expect(card.name).toBe('mock-server');
    expect(card.version).toBe('2.0.0');
    expect(card.protocol_version).toBe('2025-11-05');
  });

  it('sets capability flags based on available tools/resources/prompts', async () => {
    const connection = createMockConnection({
      tools: [{ name: 'mock_tool', description: 'A mock tool', inputSchema: { type: 'object' } }],
      resources: [{ uri: 'mock://resource', name: 'mock_resource' }],
      prompts: [{ name: 'mock_prompt', description: 'A mock prompt' }],
    });

    const card = await introspectServer(connection);

    expect(card.capabilities.tools).toBe(true);
    expect(card.capabilities.resources).toBe(true);
    expect(card.capabilities.prompts).toBe(true);
  });

  it('sets capability flags to false when no items exist', async () => {
    const connection = createMockConnection({
      tools: [],
      resources: [],
      prompts: [],
    });

    const card = await introspectServer(connection);

    expect(card.capabilities.tools).toBe(false);
    expect(card.capabilities.resources).toBe(false);
    expect(card.capabilities.prompts).toBe(false);
  });

  it('populates tools array with correct structure', async () => {
    const connection = createMockConnection({
      tools: [{ name: 'mock_tool', description: 'A mock tool', inputSchema: { type: 'object' } }],
    });

    const card = await introspectServer(connection);

    expect(card.tools).toHaveLength(1);
    expect(card.tools![0].name).toBe('mock_tool');
    expect(card.tools![0].description).toBe('A mock tool');
    expect(card.tools![0].inputSchema).toEqual({ type: 'object' });
  });

  it('populates resources array with correct structure', async () => {
    const connection = createMockConnection({
      resources: [{ uri: 'mock://resource', name: 'mock_resource' }],
    });

    const card = await introspectServer(connection);

    expect(card.resources).toHaveLength(1);
    expect(card.resources![0].uri).toBe('mock://resource');
    expect(card.resources![0].name).toBe('mock_resource');
  });

  it('populates prompts array with correct structure', async () => {
    const connection = createMockConnection({
      prompts: [{ name: 'mock_prompt', description: 'A mock prompt' }],
    });

    const card = await introspectServer(connection);

    expect(card.prompts).toHaveLength(1);
    expect(card.prompts![0].name).toBe('mock_prompt');
    expect(card.prompts![0].description).toBe('A mock prompt');
  });

  it('omits tools/resources/prompts arrays when empty', async () => {
    const connection = createMockConnection();

    const card = await introspectServer(connection);

    expect(card.tools).toBeUndefined();
    expect(card.resources).toBeUndefined();
    expect(card.prompts).toBeUndefined();
  });

  it('uses fallback name and version when server info is missing', async () => {
    const mockClient = {
      getServerVersion: () => undefined,
      getServerCapabilities: () => ({}),
      listTools: async () => ({ tools: [] }),
      listResources: async () => ({ resources: [] }),
      listPrompts: async () => ({ prompts: [] }),
    };

    const connection: McpClientConnection = {
      client: mockClient as unknown as McpClientConnection['client'],
      close: async () => {},
    };

    const card = await introspectServer(connection);

    expect(card.name).toBe('unknown');
    expect(card.version).toBe('1.0.0');
  });
});
