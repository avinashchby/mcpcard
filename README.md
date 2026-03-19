# mcpcard

**Make your MCP server discoverable without a single connection.**

[![npm version](https://img.shields.io/npm/v/mcpcard)](https://www.npmjs.com/package/mcpcard)
[![license](https://img.shields.io/npm/l/mcpcard)](./LICENSE)
[![node](https://img.shields.io/node/v/mcpcard)](https://nodejs.org)

`mcpcard` generates [MCP Server Cards](https://spec.modelcontextprotocol.io) per the **SEP-1649** specification. A server card is a static JSON file at `/.well-known/mcp/server-card.json` that describes your server's tools, resources, prompts, transport, and auth — so clients, registries, and crawlers can discover what you offer without ever connecting.

## Quickstart

```bash
npx mcpcard scan ./my-server
# => .well-known/mcp/server-card.json
```

That's it. One command, one file, full discoverability.

## Why This Exists

MCP servers are invisible until a client connects and runs the handshake. That means:

- **Registries can't index you** without spawning your server
- **Clients can't show your capabilities** before the user connects
- **Crawlers have nothing to parse** — your tools/resources are locked behind a protocol

Server Cards fix this. They're the `robots.txt` of MCP — a static, well-known file that says "here's what I do" without requiring a live connection.

`mcpcard` generates that file from your source code, a running server, or validates one you wrote by hand.

## Install

```bash
npm install -g mcpcard    # global CLI
npm install mcpcard       # local dependency + Express middleware
```

Or just use `npx mcpcard` — no install needed.

## CLI

### `scan` — Generate a card from source code

```bash
npx mcpcard scan ./my-server
npx mcpcard scan ./my-server -o ./card.json
npx mcpcard scan ./my-server --verbose
```

Statically analyzes your TypeScript or Python MCP server. Detects:

| Pattern | Language |
|---------|----------|
| `server.tool()` / `server.resource()` / `server.prompt()` | TypeScript/JS |
| `@mcp.tool()` / `@mcp.resource()` / `@mcp.prompt()` | Python |
| `new StdioServerTransport()` / `new SSEServerTransport()` | TypeScript/JS |
| `FastMCP("name")` / `McpServer({ name, version })` | Both |

### `live` — Introspect a running server

```bash
# stdio — spawns the process for you
npx mcpcard live --command "node server.js"
npx mcpcard live -c "python server.py"

# HTTP — connects to a remote server
npx mcpcard live --url https://example.com/mcp
npx mcpcard live -u http://localhost:8080/mcp
```

Connects via MCP protocol, runs `initialize` + `tools/list` + `resources/list` + `prompts/list`, and writes the card. Use this when static analysis misses something, or when you don't have source access.

### `validate` — Check a card against the schema

```bash
npx mcpcard validate server-card.json
# exit 0 = valid, exit 1 = errors printed
```

### `serve` — Host a card locally

```bash
npx mcpcard serve server-card.json
npx mcpcard serve server-card.json --port 8080
# => http://localhost:3000/.well-known/mcp/server-card.json
```

## Add a Server Card in 30 Seconds

**Option A** — Generate from source:

```bash
npx mcpcard scan ./my-server
# Deploy .well-known/mcp/server-card.json with your server
```

**Option B** — Express middleware (zero files):

```typescript
import express from 'express';
import { mcpCardMiddleware } from 'mcpcard/middleware';

const app = express();
app.use(mcpCardMiddleware('./server-card.json'));
app.listen(3000);
// => GET /.well-known/mcp/server-card.json
```

You can also pass a card object directly:

```typescript
app.use(mcpCardMiddleware({
  name: 'my-server',
  version: '1.0.0',
  description: 'My MCP server',
  capabilities: { tools: true },
  protocol_version: '2025-11-05',
  tools: [{ name: 'hello', description: 'Say hello' }]
}));
```

**Option C** — Generate from a running server:

```bash
npx mcpcard live -c "node my-server.js" -o .well-known/mcp/server-card.json
```

## Server Card Format (SEP-1649)

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "description": "What this server does",
  "homepage": "https://example.com",
  "transport": {
    "type": "streamable-http",
    "url": "https://example.com/mcp"
  },
  "authentication": {
    "type": "oauth2",
    "authorization_url": "https://example.com/auth",
    "token_url": "https://example.com/token",
    "scopes": ["read", "write"]
  },
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": true
  },
  "tools": [
    {
      "name": "search_issues",
      "description": "Search GitHub issues",
      "inputSchema": { "type": "object" },
      "annotations": { "readOnly": true }
    }
  ],
  "resources": [
    {
      "uri": "repo://main/readme",
      "name": "readme",
      "description": "Repository README"
    }
  ],
  "prompts": [
    {
      "name": "summarize",
      "description": "Summarize an issue"
    }
  ],
  "protocol_version": "2025-11-05"
}
```

## Programmatic API

```typescript
import { buildCard, validateCard } from 'mcpcard';
import type { ServerCard, McpTool } from 'mcpcard';

const card = buildCard({
  name: 'my-server',
  description: 'Does things',
  tools: [{ name: 'hello', description: 'Say hello' }]
});

const result = validateCard(card);
// { valid: true, errors: [] }
```

## License

MIT
