import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import http from 'node:http';
import { startServer, type ServerHandle } from '../../src/serve/server.js';

const FIXTURES = join(import.meta.dirname, '..', 'fixtures');
const VALID_CARD = join(FIXTURES, 'valid-card.json');

/** Helper: simple GET request returning status and body. */
function httpGet(
  url: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode ?? 0, body });
      });
    }).on('error', reject);
  });
}

describe('startServer', () => {
  let handle: ServerHandle | undefined;

  afterEach(() => {
    handle?.close();
    handle = undefined;
  });

  it('starts and stops cleanly', async () => {
    handle = await startServer(VALID_CARD, 0);
    expect(handle).toBeDefined();
    expect(typeof handle.close).toBe('function');
    handle.close();
    handle = undefined;
  });

  it('serves the card at the well-known path', async () => {
    // Use port 0 to let OS assign a free port
    // We need to get the actual port, so we access internals
    const app = (await import('express')).default();
    const { mcpCardMiddleware } = await import(
      '../../src/serve/middleware.js'
    );
    app.use(mcpCardMiddleware(VALID_CARD));

    const server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const res = await httpGet(
        `http://localhost:${port}/.well-known/mcp/server-card.json`,
      );
      expect(res.status).toBe(200);
      const card = JSON.parse(res.body);
      expect(card.name).toBe('example-mcp-server');
    } finally {
      server.close();
    }
  });
});
