import { describe, it, expect } from 'vitest';
import { connectHttp } from '../../src/live/http-client.js';
import { LiveError } from '../../src/utils/errors.js';

describe('http-client', () => {
  it('exports connectHttp function', () => {
    expect(typeof connectHttp).toBe('function');
  });

  it('throws LiveError when URL is unreachable', async () => {
    await expect(
      connectHttp('http://127.0.0.1:19999/nonexistent-mcp'),
    ).rejects.toThrow(LiveError);
  }, 15000);

  it('thrown error includes the URL in message', async () => {
    const url = 'http://127.0.0.1:19999/bogus';
    try {
      await connectHttp(url);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LiveError);
      expect((err as LiveError).message).toContain(url);
    }
  }, 15000);
});
