import { describe, it, expect } from 'vitest';
import { connectStdio } from '../../src/live/stdio-client.js';
import { LiveError } from '../../src/utils/errors.js';

describe('stdio-client', () => {
  it('exports connectStdio function', () => {
    expect(typeof connectStdio).toBe('function');
  });

  it('throws LiveError when command does not exist', async () => {
    await expect(
      connectStdio('__nonexistent_command_that_does_not_exist__', []),
    ).rejects.toThrow(LiveError);
  });

  it('thrown error includes the command name in message', async () => {
    const cmd = '__bogus_mcp_server_xyz__';
    try {
      await connectStdio(cmd, ['--flag']);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LiveError);
      expect((err as LiveError).message).toContain(cmd);
    }
  });
});
