import ts from 'typescript';
import { readFile } from 'node:fs/promises';
import type {
  McpTool,
  McpResource,
  McpPrompt,
  Transport,
} from '../types/server-card.js';

/** Result of parsing a single source file for MCP server patterns. */
export interface ParsedServer {
  tools: McpTool[];
  resources: McpResource[];
  prompts: McpPrompt[];
  transport?: Transport;
  serverName?: string;
  serverVersion?: string;
}

/** Create an empty ParsedServer with no detected elements. */
export function emptyParsedServer(): ParsedServer {
  return { tools: [], resources: [], prompts: [] };
}

/** Extract the text of a string literal node, or undefined if not a string. */
function getStringLiteral(node: ts.Node): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return undefined;
}

/** Extract arguments from a call expression like server.tool(...). */
function getCallArgs(node: ts.CallExpression): ts.NodeArray<ts.Expression> {
  return node.arguments;
}

/**
 * Detect McpServer constructor: new McpServer({ name: "...", version: "..." }).
 * Extracts server name and version from the object literal argument.
 */
function detectServerConstructor(
  node: ts.Node,
  result: ParsedServer,
): void {
  if (!ts.isNewExpression(node)) return;
  const exprText = node.expression.getText();
  if (!exprText.includes('McpServer')) return;

  const args = node.arguments;
  if (!args || args.length === 0) return;

  const objArg = args[0];
  if (!ts.isObjectLiteralExpression(objArg)) return;

  for (const prop of objArg.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const propName = prop.name.getText();
    const value = getStringLiteral(prop.initializer);
    if (propName === 'name' && value) result.serverName = value;
    if (propName === 'version' && value) result.serverVersion = value;
  }
}

/**
 * Detect transport instantiation patterns:
 * - new StdioServerTransport()
 * - new SSEServerTransport()
 * - new StreamableHTTPServerTransport()
 */
function detectTransport(node: ts.Node, result: ParsedServer): void {
  if (!ts.isNewExpression(node)) return;
  const exprText = node.expression.getText();

  if (exprText.includes('StdioServerTransport')) {
    result.transport = { type: 'stdio' };
  } else if (exprText.includes('SSEServerTransport')) {
    result.transport = { type: 'sse' };
  } else if (exprText.includes('StreamableHTTPServerTransport')) {
    result.transport = { type: 'streamable-http' };
  }
}

/**
 * Parse a server.tool(...) call expression.
 * Supports two variants:
 *   server.tool("name", "desc", { schema }, handler)
 *   server.tool("name", handler)
 */
function parseToolCall(args: ts.NodeArray<ts.Expression>): McpTool | null {
  if (args.length < 2) return null;

  const name = getStringLiteral(args[0]);
  if (!name) return null;

  if (args.length >= 3) {
    const desc = getStringLiteral(args[1]);
    return { name, description: desc ?? '' };
  }

  return { name, description: '' };
}

/**
 * Parse a server.resource(...) call expression.
 * Supports:
 *   server.resource("uri", handler)
 *   server.resource("uri", "name", handler)
 */
function parseResourceCall(
  args: ts.NodeArray<ts.Expression>,
): McpResource | null {
  if (args.length < 2) return null;

  const uri = getStringLiteral(args[0]);
  if (!uri) return null;

  const secondArg = getStringLiteral(args[1]);
  if (secondArg && args.length >= 3) {
    return { uri, name: secondArg };
  }

  return { uri, name: uri };
}

/**
 * Parse a server.prompt(...) call expression.
 * Supports:
 *   server.prompt("name", handler)
 *   server.prompt("name", "description", handler)
 */
function parsePromptCall(args: ts.NodeArray<ts.Expression>): McpPrompt | null {
  if (args.length < 2) return null;

  const name = getStringLiteral(args[0]);
  if (!name) return null;

  if (args.length >= 3) {
    const desc = getStringLiteral(args[1]);
    return { name, description: desc ?? undefined };
  }

  return { name };
}

/** Detect server.tool/resource/prompt method calls on any receiver. */
function detectMethodCall(
  node: ts.Node,
  result: ParsedServer,
): void {
  if (!ts.isCallExpression(node)) return;
  if (!ts.isPropertyAccessExpression(node.expression)) return;

  const methodName = node.expression.name.text;
  const args = getCallArgs(node);

  if (methodName === 'tool') {
    const tool = parseToolCall(args);
    if (tool) result.tools.push(tool);
  } else if (methodName === 'resource') {
    const resource = parseResourceCall(args);
    if (resource) result.resources.push(resource);
  } else if (methodName === 'prompt') {
    const prompt = parsePromptCall(args);
    if (prompt) result.prompts.push(prompt);
  }
}

/** Recursively walk the AST and extract all MCP patterns. */
function walkNode(node: ts.Node, result: ParsedServer): void {
  detectServerConstructor(node, result);
  detectTransport(node, result);
  detectMethodCall(node, result);
  ts.forEachChild(node, (child) => walkNode(child, result));
}

/**
 * Parse a TypeScript or JavaScript file for MCP SDK patterns.
 * Uses the TypeScript compiler API to build an AST, then walks
 * it to detect tool, resource, prompt, transport, and server
 * name/version declarations.
 */
export async function parseTsFile(filePath: string): Promise<ParsedServer> {
  const source = await readFile(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  const result = emptyParsedServer();
  walkNode(sourceFile, result);
  return result;
}
