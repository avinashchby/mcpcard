import { readFileSync } from 'node:fs';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ServerCard } from '../types/server-card.js';

/** Well-known path where the server card is served. */
const CARD_PATH = '/.well-known/mcp/server-card.json';

/**
 * Create Express middleware that serves an MCP server card.
 * If cardPathOrCard is a string, reads the JSON file on each request
 * so that changes are picked up without restart.
 * If cardPathOrCard is a ServerCard object, serves it directly.
 */
export function mcpCardMiddleware(
  cardPathOrCard: string | ServerCard,
): RequestHandler {
  if (typeof cardPathOrCard === 'string') {
    return createFileMiddleware(cardPathOrCard);
  }
  return createObjectMiddleware(cardPathOrCard);
}

/** Middleware that reads from a file path on each request. */
function createFileMiddleware(cardPath: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.path !== CARD_PATH) {
      next();
      return;
    }

    try {
      const raw = readFileSync(cardPath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(raw);
    } catch (err: unknown) {
      if (isNodeError(err) && err.code === 'ENOENT') {
        res.status(404).json({
          error: `Card file not found: ${cardPath}`,
          hint: 'Run "mcpcard scan" or "mcpcard live" to generate a card.',
        });
        return;
      }
      next(err);
    }
  };
}

/** Middleware that serves a pre-loaded ServerCard object. */
function createObjectMiddleware(card: ServerCard): RequestHandler {
  const json = JSON.stringify(card, null, 2);

  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.path !== CARD_PATH) {
      next();
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(json);
  };
}

/** Type guard for Node.js system errors. */
function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}

export default mcpCardMiddleware;
