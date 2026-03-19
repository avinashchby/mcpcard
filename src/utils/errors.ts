/** Base error class for all mcpcard errors. */
export class McpCardError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'McpCardError';
  }
}

/** Error during source code scanning. */
export class ScanError extends McpCardError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ScanError';
  }
}

/** Error during live MCP server introspection. */
export class LiveError extends McpCardError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LiveError';
  }
}

/** Error during server card validation. */
export class ValidationError extends McpCardError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ValidationError';
  }
}

/** Error during card serving. */
export class ServeError extends McpCardError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ServeError';
  }
}
