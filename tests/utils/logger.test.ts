import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setLogLevel,
  getLogLevel,
  info,
  warn,
  error,
  verbose,
} from '../../src/utils/logger.js';

describe('logger', () => {
  beforeEach(() => {
    setLogLevel('normal');
    vi.restoreAllMocks();
  });

  it('defaults to normal level', () => {
    expect(getLogLevel()).toBe('normal');
  });

  it('setLogLevel changes the level', () => {
    setLogLevel('verbose');
    expect(getLogLevel()).toBe('verbose');
  });

  describe('quiet mode', () => {
    it('suppresses info messages', () => {
      setLogLevel('quiet');
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      info('test');
      expect(spy).not.toHaveBeenCalled();
    });

    it('suppresses warn messages', () => {
      setLogLevel('quiet');
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warn('test');
      expect(spy).not.toHaveBeenCalled();
    });

    it('still shows error messages', () => {
      setLogLevel('quiet');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      error('test');
      expect(spy).toHaveBeenCalledOnce();
    });

    it('suppresses verbose messages', () => {
      setLogLevel('quiet');
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      verbose('test');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('normal mode', () => {
    it('shows info messages', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      info('test');
      expect(spy).toHaveBeenCalledOnce();
    });

    it('shows warn messages', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warn('test');
      expect(spy).toHaveBeenCalledOnce();
    });

    it('shows error messages', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      error('test');
      expect(spy).toHaveBeenCalledOnce();
    });

    it('suppresses verbose messages', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      verbose('test');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('verbose mode', () => {
    it('shows all message types', () => {
      setLogLevel('verbose');
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      info('i');
      warn('w');
      error('e');
      verbose('v');

      expect(logSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(errorSpy).toHaveBeenCalledOnce();
      expect(debugSpy).toHaveBeenCalledOnce();
    });
  });
});
