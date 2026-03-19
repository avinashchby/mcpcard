import { readFile } from 'node:fs/promises';
import type {
  McpTool,
  McpResource,
  McpPrompt,
} from '../types/server-card.js';
import type { ParsedServer } from './ts-parser.js';
import { emptyParsedServer } from './ts-parser.js';

/** Pattern matching FastMCP("server-name") constructor. */
const FASTMCP_PATTERN = /FastMCP\(\s*["']([^"']+)["']\s*\)/;

/** Pattern matching @mcp.tool() or @server.tool() decorator. */
const TOOL_DECORATOR = /^@\w+\.tool\(\s*\)/;

/** Pattern matching @mcp.resource("uri") or @server.resource("uri"). */
const RESOURCE_DECORATOR = /^@\w+\.resource\(\s*["']([^"']+)["']\s*\)/;

/** Pattern matching @mcp.prompt() or @server.prompt() decorator. */
const PROMPT_DECORATOR = /^@\w+\.prompt\(\s*\)/;

/** Pattern matching a Python function definition. */
const FUNC_DEF = /^def\s+(\w+)\s*\(/;

/** Pattern matching triple-quoted docstrings (single line). */
const DOCSTRING = /^\s+"""(.+?)"""/;

/** Pattern matching multiline docstring opening. */
const DOCSTRING_OPEN = /^\s+"""/;

/** Pattern matching multiline docstring closing. */
const DOCSTRING_CLOSE = /"""/;

/**
 * Extract the server name from a FastMCP constructor call.
 * Returns undefined if no match found.
 */
function extractServerName(source: string): string | undefined {
  const match = FASTMCP_PATTERN.exec(source);
  return match?.[1];
}

/**
 * Extract a docstring from lines following a function definition.
 * Handles both single-line and multi-line triple-quoted strings.
 */
function extractDocstring(
  lines: string[],
  startIdx: number,
): string | undefined {
  if (startIdx >= lines.length) return undefined;
  const line = lines[startIdx];

  const singleMatch = DOCSTRING.exec(line);
  if (singleMatch) return singleMatch[1];

  if (!DOCSTRING_OPEN.test(line)) return undefined;

  return collectMultilineDocstring(lines, startIdx);
}

/**
 * Collect a multi-line docstring starting from the opening triple-quote line.
 * Returns the concatenated docstring content.
 */
function collectMultilineDocstring(
  lines: string[],
  startIdx: number,
): string {
  const parts: string[] = [];
  const firstLine = lines[startIdx].replace(/^\s+"""/, '').trim();
  if (firstLine) parts.push(firstLine);

  for (let j = startIdx + 1; j < lines.length; j++) {
    if (DOCSTRING_CLOSE.test(lines[j])) {
      const closing = lines[j].replace(/""".*/, '').trim();
      if (closing) parts.push(closing);
      break;
    }
    parts.push(lines[j].trim());
  }

  return parts.join(' ').trim();
}

/** State tracker for which decorator type is currently active. */
type PendingDecorator =
  | { kind: 'tool' }
  | { kind: 'resource'; uri: string }
  | { kind: 'prompt' }
  | null;

/**
 * Check if a line matches a decorator and return the pending state.
 * Returns null if the line is not a recognized decorator.
 */
function matchDecorator(line: string): PendingDecorator {
  const trimmed = line.trim();

  if (TOOL_DECORATOR.test(trimmed)) {
    return { kind: 'tool' };
  }

  const resourceMatch = RESOURCE_DECORATOR.exec(trimmed);
  if (resourceMatch) {
    return { kind: 'resource', uri: resourceMatch[1] };
  }

  if (PROMPT_DECORATOR.test(trimmed)) {
    return { kind: 'prompt' };
  }

  return null;
}

/**
 * Process a function definition line when a decorator is pending.
 * Creates the appropriate tool/resource/prompt entry.
 */
function processFuncDef(
  funcName: string,
  lines: string[],
  lineIdx: number,
  pending: NonNullable<PendingDecorator>,
  result: ParsedServer,
): void {
  const docstring = extractDocstring(lines, lineIdx + 1);

  if (pending.kind === 'tool') {
    const tool: McpTool = { name: funcName, description: docstring ?? '' };
    result.tools.push(tool);
  } else if (pending.kind === 'resource') {
    const resource: McpResource = {
      uri: pending.uri,
      name: funcName,
      description: docstring,
    };
    result.resources.push(resource);
  } else if (pending.kind === 'prompt') {
    const prompt: McpPrompt = { name: funcName, description: docstring };
    result.prompts.push(prompt);
  }
}

/**
 * Parse a Python file for MCP FastMCP SDK patterns.
 * Uses regex-based parsing to detect @mcp.tool(), @mcp.resource(),
 * @mcp.prompt() decorators and extract function names, docstrings,
 * and the server name from FastMCP constructor calls.
 */
export async function parsePyFile(filePath: string): Promise<ParsedServer> {
  const source = await readFile(filePath, 'utf-8');
  const result = emptyParsedServer();

  result.serverName = extractServerName(source);

  const lines = source.split('\n');
  let pending: PendingDecorator = null;

  for (let i = 0; i < lines.length; i++) {
    const decorator = matchDecorator(lines[i]);
    if (decorator) {
      pending = decorator;
      continue;
    }

    if (!pending) continue;

    const funcMatch = FUNC_DEF.exec(lines[i].trim());
    if (funcMatch) {
      processFuncDef(funcMatch[1], lines, i, pending, result);
      pending = null;
    }
  }

  return result;
}
