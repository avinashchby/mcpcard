import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { LiveError } from '../utils/errors.js';
import { verbose } from '../utils/logger.js';
import type { McpClientConnection } from './types.js';

/** Client identity sent during MCP initialization. */
const CLIENT_INFO = { name: 'mcpcard', version: '0.1.0' } as const;

/**
 * Connect to an MCP server via stdio transport.
 *
 * Spawns the given command as a child process and establishes
 * an MCP client connection over stdin/stdout.
 *
 * @param command - The executable to spawn (e.g. "npx", "python")
 * @param args - Arguments to pass to the command
 * @returns A connected McpClientConnection
 * @throws LiveError if the command fails to spawn or connection fails
 */
export async function connectStdio(
  command: string,
  args: string[] = [],
): Promise<McpClientConnection> {
  verbose(`Connecting via stdio: ${command} ${args.join(' ')}`);

  let transport: StdioClientTransport;
  try {
    transport = new StdioClientTransport({ command, args });
  } catch (err) {
    throw new LiveError(
      `Failed to create stdio transport for "${command}": ${String(err)}`,
      { cause: err },
    );
  }

  const client = new Client(CLIENT_INFO);

  try {
    await client.connect(transport);
  } catch (err) {
    throw new LiveError(
      `Failed to connect to MCP server via stdio ("${command}"): ${String(err)}`,
      { cause: err },
    );
  }

  verbose(`Connected to MCP server via stdio: ${command}`);

  return {
    client,
    async close() {
      verbose('Closing stdio connection');
      await client.close();
    },
  };
}
