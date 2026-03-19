import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { LiveError } from '../utils/errors.js';
import { verbose } from '../utils/logger.js';
import type { McpClientConnection } from './types.js';

/** Client identity sent during MCP initialization. */
const CLIENT_INFO = { name: 'mcpcard', version: '0.1.0' } as const;

/**
 * Attempt connection using StreamableHTTP transport.
 *
 * @param url - The server URL to connect to
 * @returns A connected Client, or null if this transport is unsupported
 */
async function tryStreamableHttp(url: string): Promise<Client | null> {
  const transport = new StreamableHTTPClientTransport(new URL(url));
  const client = new Client(CLIENT_INFO);
  try {
    await client.connect(transport);
    return client;
  } catch {
    await client.close().catch(() => {});
    return null;
  }
}

/**
 * Attempt connection using SSE transport as fallback.
 *
 * @param url - The server URL to connect to
 * @returns A connected Client
 * @throws Error if connection fails
 */
async function trySSE(url: string): Promise<Client> {
  const transport = new SSEClientTransport(new URL(url));
  const client = new Client(CLIENT_INFO);
  await client.connect(transport);
  return client;
}

/**
 * Connect to an MCP server via HTTP transport.
 *
 * Tries StreamableHTTP first, falls back to SSE if that fails.
 *
 * @param url - The HTTP(S) URL of the MCP server
 * @returns A connected McpClientConnection
 * @throws LiveError if both transports fail
 */
export async function connectHttp(
  url: string,
): Promise<McpClientConnection> {
  verbose(`Connecting via HTTP: ${url}`);

  const streamableClient = await tryStreamableHttp(url);
  if (streamableClient) {
    verbose(`Connected via StreamableHTTP: ${url}`);
    return buildConnection(streamableClient);
  }

  verbose('StreamableHTTP failed, trying SSE fallback');

  try {
    const sseClient = await trySSE(url);
    verbose(`Connected via SSE: ${url}`);
    return buildConnection(sseClient);
  } catch (err) {
    throw new LiveError(
      `Failed to connect to MCP server at "${url}": ${String(err)}`,
      { cause: err },
    );
  }
}

/**
 * Wrap a connected Client into a McpClientConnection.
 *
 * @param client - The connected MCP Client instance
 * @returns A McpClientConnection with close() lifecycle
 */
function buildConnection(client: Client): McpClientConnection {
  return {
    client,
    async close() {
      verbose('Closing HTTP connection');
      await client.close();
    },
  };
}
