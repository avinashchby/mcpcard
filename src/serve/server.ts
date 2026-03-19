import express from 'express';
import type { Server } from 'node:http';
import { mcpCardMiddleware } from './middleware.js';
import { info } from '../utils/logger.js';

/** Default port for the card server. */
const DEFAULT_PORT = 3000;

/** Handle returned by startServer for clean shutdown. */
export interface ServerHandle {
  close(): void;
}

/**
 * Start an Express server that serves the MCP server card
 * at /.well-known/mcp/server-card.json.
 * Returns a handle to close the server.
 */
export async function startServer(
  cardPath: string,
  port?: number,
): Promise<ServerHandle> {
  const resolvedPort = port ?? DEFAULT_PORT;
  const app = express();

  app.use(mcpCardMiddleware(cardPath));

  const server = await listen(app, resolvedPort);

  const url = `http://localhost:${resolvedPort}`;
  const cardUrl = `${url}/.well-known/mcp/server-card.json`;
  info(`Server card available at ${cardUrl}`);

  return {
    close() {
      server.close();
    },
  };
}

/** Wrap server.listen in a promise. */
function listen(
  app: express.Express,
  port: number,
): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port, () => resolve(server))
      .on('error', reject);
  });
}
