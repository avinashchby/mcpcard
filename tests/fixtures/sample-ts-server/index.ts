import { McpServer, StdioServerTransport } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: "test-server", version: "1.0.0" });

server.tool("search_issues", "Search GitHub issues", { query: z.string(), repo: z.string().optional() }, async ({ query, repo }) => {
  return { content: [{ type: "text", text: "results" }] };
});

server.tool("create_issue", "Create a new issue", { title: z.string(), body: z.string() }, async ({ title, body }) => {
  return { content: [{ type: "text", text: "created" }] };
});

server.resource("repo://main/readme", async (uri) => {
  return { contents: [{ uri: uri.href, text: "README content" }] };
});

server.prompt("summarize", "Summarize an issue", async () => {
  return { messages: [{ role: "user", content: { type: "text", text: "Summarize" } }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
