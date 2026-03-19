import { describe, it, expect } from 'vitest';
import { buildCard } from '../../src/card/card-builder.js';

describe('card-builder', () => {
  describe('defaults', () => {
    it('uses default version 1.0.0', () => {
      const card = buildCard({ name: 'test' });
      expect(card.version).toBe('1.0.0');
    });

    it('uses default protocol_version 2025-11-05', () => {
      const card = buildCard({ name: 'test' });
      expect(card.protocol_version).toBe('2025-11-05');
    });

    it('uses empty string as default description', () => {
      const card = buildCard({ name: 'test' });
      expect(card.description).toBe('');
    });

    it('does not include optional fields when not provided', () => {
      const card = buildCard({ name: 'test' });
      expect(card.homepage).toBeUndefined();
      expect(card.transport).toBeUndefined();
      expect(card.authentication).toBeUndefined();
      expect(card.tools).toBeUndefined();
      expect(card.resources).toBeUndefined();
      expect(card.prompts).toBeUndefined();
    });
  });

  describe('capabilities auto-detection', () => {
    it('sets tools=true when tools are provided', () => {
      const card = buildCard({
        name: 'test',
        tools: [{ name: 'tool1', description: 'A tool' }],
      });
      expect(card.capabilities.tools).toBe(true);
      expect(card.capabilities.resources).toBe(false);
      expect(card.capabilities.prompts).toBe(false);
    });

    it('sets resources=true when resources are provided', () => {
      const card = buildCard({
        name: 'test',
        resources: [{ uri: 'file:///a', name: 'res1' }],
      });
      expect(card.capabilities.resources).toBe(true);
    });

    it('sets prompts=true when prompts are provided', () => {
      const card = buildCard({
        name: 'test',
        prompts: [{ name: 'prompt1' }],
      });
      expect(card.capabilities.prompts).toBe(true);
    });

    it('sets all false when no tools/resources/prompts', () => {
      const card = buildCard({ name: 'test' });
      expect(card.capabilities.tools).toBe(false);
      expect(card.capabilities.resources).toBe(false);
      expect(card.capabilities.prompts).toBe(false);
    });
  });

  describe('deduplication', () => {
    it('deduplicates tools by name keeping the first', () => {
      const card = buildCard({
        name: 'test',
        tools: [
          { name: 'alpha', description: 'first' },
          { name: 'alpha', description: 'duplicate' },
        ],
      });
      expect(card.tools).toHaveLength(1);
      expect(card.tools![0].description).toBe('first');
    });

    it('deduplicates resources by name', () => {
      const card = buildCard({
        name: 'test',
        resources: [
          { uri: 'a', name: 'res' },
          { uri: 'b', name: 'res' },
        ],
      });
      expect(card.resources).toHaveLength(1);
      expect(card.resources![0].uri).toBe('a');
    });

    it('deduplicates prompts by name', () => {
      const card = buildCard({
        name: 'test',
        prompts: [
          { name: 'p', description: 'first' },
          { name: 'p', description: 'dup' },
        ],
      });
      expect(card.prompts).toHaveLength(1);
    });
  });

  describe('sorting', () => {
    it('sorts tools alphabetically by name', () => {
      const card = buildCard({
        name: 'test',
        tools: [
          { name: 'zeta', description: 'z' },
          { name: 'alpha', description: 'a' },
          { name: 'mu', description: 'm' },
        ],
      });
      expect(card.tools!.map((t) => t.name)).toEqual([
        'alpha',
        'mu',
        'zeta',
      ]);
    });

    it('sorts resources alphabetically by name', () => {
      const card = buildCard({
        name: 'test',
        resources: [
          { uri: 'b', name: 'beta' },
          { uri: 'a', name: 'alpha' },
        ],
      });
      expect(card.resources!.map((r) => r.name)).toEqual([
        'alpha',
        'beta',
      ]);
    });

    it('sorts prompts alphabetically by name', () => {
      const card = buildCard({
        name: 'test',
        prompts: [
          { name: 'charlie' },
          { name: 'alice' },
        ],
      });
      expect(card.prompts!.map((p) => p.name)).toEqual([
        'alice',
        'charlie',
      ]);
    });
  });
});
