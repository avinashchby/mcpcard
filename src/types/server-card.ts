/** MCP Server Card tool definition. */
export interface McpTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
}

/** MCP Server Card resource definition. */
export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/** MCP Server Card prompt definition. */
export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: PromptArgument[];
}

/** Argument for an MCP prompt. */
export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

/** Transport configuration for how clients connect to the server. */
export interface Transport {
  type: 'stdio' | 'streamable-http' | 'sse';
  url?: string;
  command?: string;
  args?: string[];
}

/** Authentication configuration for the MCP server. */
export interface Authentication {
  type: 'oauth2' | 'api-key' | 'none';
  authorization_url?: string;
  token_url?: string;
  scopes?: string[];
}

/** Capabilities flags indicating what the server supports. */
export interface Capabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
}

/** Full MCP Server Card per SEP-1649. */
export interface ServerCard {
  name: string;
  version: string;
  description: string;
  homepage?: string;
  transport?: Transport;
  authentication?: Authentication;
  capabilities: Capabilities;
  tools?: McpTool[];
  resources?: McpResource[];
  prompts?: McpPrompt[];
  protocol_version: string;
}
