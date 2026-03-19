import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import express from 'express';
import http from 'node:http';
import { mcpCardMiddleware } from '../../src/serve/middleware.js';

const FIXTURES = join(import.meta.dirname, '..', 'fixtures');
const VALID_CARD = join(FIXTURES, 'valid-card.json');

/** Helper: start an express app and return a request function and cleanup. */
function createTestServer(
  middleware: express.RequestHandler,
): Promise<{ url: string; close: () => void }> {
  const app = express();
  app.use(middleware);
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({
        url: `http://localhost:${port}`,
        close: () => server.close(),
      });
    });
  });
}

/** Helper: simple GET request that returns status, headers, body. */
function httpGet(
  url: string,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body,
        });
      });
    }).on('error', reject);
  });
}

describe('mcpCardMiddleware', () => {
  describe('with file path', () => {
    it('serves the card at the well-known path', async () => {
      const { url, close } = await createTestServer(
        mcpCardMiddleware(VALID_CARD),
      );

      try {
        const res = await httpGet(
          `${url}/.well-known/mcp/server-card.json`,
        );
        expect(res.status).toBe(200);
        const card = JSON.parse(res.body);
        expect(card.name).toBe('example-mcp-server');
      } finally {
        close();
      }
    });

    it('returns application/json content type', async () => {
      const { url, close } = await createTestServer(
        mcpCardMiddleware(VALID_CARD),
      );

      try {
        const res = await httpGet(
          `${url}/.well-known/mcp/server-card.json`,
        );
        expect(res.headers['content-type']).toContain('application/json');
      } finally {
        close();
      }
    });

    it('returns 404 for non-existent card file', async () => {
      const { url, close } = await createTestServer(
        mcpCardMiddleware('/tmp/no-such-card-file.json'),
      );

      try {
        const res = await httpGet(
          `${url}/.well-known/mcp/server-card.json`,
        );
        expect(res.status).toBe(404);
        const body = JSON.parse(res.body);
        expect(body.error).toContain('not found');
      } finally {
        close();
      }
    });
  });

  describe('with ServerCard object', () => {
    it('serves the card object directly', async () => {
      const card = {
        name: 'test-server',
        version: '1.0.0',
        description: 'Test',
        capabilities: { tools: false, resources: false, prompts: false },
        protocol_version: '2025-11-05',
      };

      const { url, close } = await createTestServer(
        mcpCardMiddleware(card),
      );

      try {
        const res = await httpGet(
          `${url}/.well-known/mcp/server-card.json`,
        );
        expect(res.status).toBe(200);
        const parsed = JSON.parse(res.body);
        expect(parsed.name).toBe('test-server');
      } finally {
        close();
      }
    });
  });
});
