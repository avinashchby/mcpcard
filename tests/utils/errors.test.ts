import { describe, it, expect } from 'vitest';
import {
  McpCardError,
  ScanError,
  LiveError,
  ValidationError,
  ServeError,
} from '../../src/utils/errors.js';

describe('errors', () => {
  it('McpCardError has correct name and message', () => {
    const err = new McpCardError('base error');
    expect(err.name).toBe('McpCardError');
    expect(err.message).toBe('base error');
    expect(err instanceof Error).toBe(true);
  });

  it('ScanError extends McpCardError', () => {
    const err = new ScanError('scan failed');
    expect(err.name).toBe('ScanError');
    expect(err instanceof McpCardError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('LiveError extends McpCardError', () => {
    const err = new LiveError('live failed');
    expect(err.name).toBe('LiveError');
    expect(err instanceof McpCardError).toBe(true);
  });

  it('ValidationError extends McpCardError', () => {
    const err = new ValidationError('invalid');
    expect(err.name).toBe('ValidationError');
    expect(err instanceof McpCardError).toBe(true);
  });

  it('ServeError extends McpCardError', () => {
    const err = new ServeError('serve failed');
    expect(err.name).toBe('ServeError');
    expect(err instanceof McpCardError).toBe(true);
  });

  it('supports cause option', () => {
    const cause = new Error('root cause');
    const err = new ScanError('scan failed', { cause });
    expect(err.cause).toBe(cause);
  });
});
