import type { McpClientConnection } from './types.js';
import type { ServerCard, McpTool, McpResource, McpPrompt } from '../types/server-card.js';
import { buildCard } from '../card/card-builder.js';
import { LiveError } from '../utils/errors.js';
import { verbose } from '../utils/logger.js';
import { connectStdio } from './stdio-client.js';
import { connectHttp } from './http-client.js';

/**
 * Fetch the list of tools from the connected server.
 *
 * @param connection - An active MCP client connection
 * @returns Array of McpTool objects, empty if tools not supported
 */
async function fetchTools(connection: McpClientConnection): Promise<McpTool[]> {
  try {
    const result = await connection.client.listTools();
    return (result.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? '',
      ...(t.inputSchema ? { inputSchema: t.inputSchema as Record<string, unknown> } : {}),
      ...(t.annotations ? { annotations: t.annotations as Record<string, unknown> } : {}),
    }));
  } catch {
    verbose('Server does not support tools or listTools failed');
    return [];
  }
}

/**
 * Fetch the list of resources from the connected server.
 *
 * @param connection - An active MCP client connection
 * @returns Array of McpResource objects, empty if resources not supported
 */
async function fetchResources(connection: McpClientConnection): Promise<McpResource[]> {
  try {
    const result = await connection.client.listResources();
    return (result.resources ?? []).map((r) => ({
      uri: r.uri,
      name: r.name,
      ...(r.description ? { description: r.description } : {}),
      ...(r.mimeType ? { mimeType: r.mimeType } : {}),
    }));
  } catch {
    verbose('Server does not support resources or listResources failed');
    return [];
  }
}

/**
 * Fetch the list of prompts from the connected server.
 *
 * @param connection - An active MCP client connection
 * @returns Array of McpPrompt objects, empty if prompts not supported
 */
async function fetchPrompts(connection: McpClientConnection): Promise<McpPrompt[]> {
  try {
    const result = await connection.client.listPrompts();
    return (result.prompts ?? []).map((p) => ({
      name: p.name,
      ...(p.description ? { description: p.description } : {}),
      ...(p.arguments ? { arguments: p.arguments } : {}),
    }));
  } catch {
    verbose('Server does not support prompts or listPrompts failed');
    return [];
  }
}

/**
 * Introspect a connected MCP server and build a ServerCard.
 *
 * Queries the server for tools, resources, and prompts, then
 * assembles a complete ServerCard using buildCard().
 *
 * @param connection - An active MCP client connection
 * @returns A fully populated ServerCard
 * @throws LiveError if introspection fails
 */
export async function introspectServer(
  connection: McpClientConnection,
): Promise<ServerCard> {
  verbose('Starting server introspection');

  const serverVersion = connection.client.getServerVersion();
  const serverName = serverVersion?.name ?? 'unknown';
  const version = serverVersion?.version ?? '1.0.0';

  verbose(`Server: ${serverName} v${version}`);

  const [tools, resources, prompts] = await Promise.all([
    fetchTools(connection),
    fetchResources(connection),
    fetchPrompts(connection),
  ]);

  verbose(`Found ${tools.length} tools, ${resources.length} resources, ${prompts.length} prompts`);

  return buildCard({
    name: serverName,
    version,
    tools: tools.length > 0 ? tools : undefined,
    resources: resources.length > 0 ? resources : undefined,
    prompts: prompts.length > 0 ? prompts : undefined,
  });
}

/**
 * Connect to an MCP server via stdio, introspect it, and return a ServerCard.
 *
 * This is a convenience wrapper that handles the full lifecycle:
 * connect, introspect, close.
 *
 * @param command - The executable to spawn
 * @param args - Arguments to pass to the command
 * @returns A fully populated ServerCard
 * @throws LiveError if connection or introspection fails
 */
export async function introspectViaStdio(
  command: string,
  args: string[] = [],
): Promise<ServerCard> {
  const connection = await connectStdio(command, args);
  try {
    return await introspectServer(connection);
  } finally {
    await connection.close();
  }
}

/**
 * Connect to an MCP server via HTTP, introspect it, and return a ServerCard.
 *
 * This is a convenience wrapper that handles the full lifecycle:
 * connect, introspect, close.
 *
 * @param url - The HTTP(S) URL of the MCP server
 * @returns A fully populated ServerCard
 * @throws LiveError if connection or introspection fails
 */
export async function introspectViaHttp(
  url: string,
): Promise<ServerCard> {
  const connection = await connectHttp(url);
  try {
    return await introspectServer(connection);
  } finally {
    await connection.close();
  }
}
