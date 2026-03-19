import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

/** Wrapper around a connected MCP client with lifecycle management. */
export interface McpClientConnection {
  /** The underlying MCP SDK client instance. */
  client: Client;
  /** Close the connection and clean up resources. */
  close(): Promise<void>;
}
