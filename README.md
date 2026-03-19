# mcpcard

Generate [MCP Server Cards](https://spec.modelcontextprotocol.io) per the **SEP-1649** specification.

MCP Server Cards expose structured metadata at `/.well-known/mcp/server-card.json`, letting clients, registries, and crawlers discover your server's capabilities **without connecting**.

## Quick Start

```bash
# Scan your MCP server's source code
npx mcpcard scan ./my-server

# Introspect a running server
npx mcpcard live --command "node server.js"

# Validate an existing card
npx mcpcard validate server-card.json

# Serve a card locally
npx mcpcard serve server-card.json
```

## Installation

```bash
npm install -g mcpcard    # global CLI
npm install mcpcard       # local + middleware
```

## CLI Commands

### `scan` — Generate card from source code

```bash
npx mcpcard scan ./my-server
npx mcpcard scan ./my-server --output ./card.json
npx mcpcard scan ./my-server --verbose
```

Parses TypeScript and Python MCP servers. Detects:
- `server.tool()`, `server.resource()`, `server.prompt()` (TS/JS)
- `@mcp.tool()`, `@mcp.resource()`, `@mcp.prompt()` decorators (Python)
- Transport configuration (`StdioServerTransport`, `SSEServerTransport`, etc.)
- Server name and version from `McpServer()` constructor or `FastMCP()`

### `live` — Introspect a running server

```bash
# Via stdio (spawns the process)
npx mcpcard live --command "node server.js"
npx mcpcard live -c "python server.py"

# Via HTTP
npx mcpcard live --url https://example.com/mcp
npx mcpcard live -u http://localhost:8080/mcp
```

Connects to the server, runs the MCP handshake, and calls `tools/list`, `resources/list`, and `prompts/list` to build the card.

### `validate` — Validate a server card

```bash
npx mcpcard validate server-card.json
```

Validates against the SEP-1649 JSON Schema. Exits `0` if valid, `1` with error details if not.

### `serve` — Serve a card locally

```bash
npx mcpcard serve server-card.json
npx mcpcard serve server-card.json --port 8080
```

Starts an HTTP server at `http://localhost:3000/.well-known/mcp/server-card.json`.

## Add a Server Card to Your MCP Server in 30 Seconds

### Option 1: Generate and serve statically

```bash
npx mcpcard scan ./my-server
# Creates .well-known/mcp/server-card.json
# Copy this file to your server's public directory
```

### Option 2: Use the Express middleware

```typescript
import express from 'express';
import { mcpCardMiddleware } from 'mcpcard/middleware';

const app = express();

// Serve from a file (re-reads on each request)
app.use(mcpCardMiddleware('./server-card.json'));

// Or serve a card object directly
app.use(mcpCardMiddleware({
  name: 'my-server',
  version: '1.0.0',
  description: 'My MCP server',
  capabilities: { tools: true },
  protocol_version: '2025-11-05',
  tools: [{ name: 'hello', description: 'Say hello' }]
}));

app.listen(3000);
```

### Option 3: Generate from a running server

```bash
npx mcpcard live --command "node my-server.js" --output .well-known/mcp/server-card.json
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
    "prompts": false
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
  "prompts": [],
  "protocol_version": "2025-11-05"
}
```

## Programmatic API

```typescript
import { buildCard, validateCard } from 'mcpcard';
import type { ServerCard, McpTool } from 'mcpcard';

// Build a card
const card = buildCard({
  name: 'my-server',
  description: 'Does things',
  tools: [{ name: 'hello', description: 'Say hello' }]
});

// Validate a card
const result = validateCard(card);
console.log(result.valid);    // true
console.log(result.errors);   // []
```

## License

MIT
