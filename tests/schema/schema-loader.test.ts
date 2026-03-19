import { describe, it, expect } from 'vitest';
import { validateCard, getValidator } from '../../src/schema/schema-loader.js';
import validCard from '../fixtures/valid-card.json';
import invalidCard from '../fixtures/invalid-card.json';

describe('schema-loader', () => {
  describe('getValidator', () => {
    it('returns a compiled validate function', () => {
      const validator = getValidator();
      expect(typeof validator).toBe('function');
    });

    it('returns the same cached instance on repeated calls', () => {
      const v1 = getValidator();
      const v2 = getValidator();
      expect(v1).toBe(v2);
    });
  });

  describe('validateCard', () => {
    it('accepts a valid server card', () => {
      const result = validateCard(validCard);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects a card missing the required name field', () => {
      const result = validateCard(invalidCard);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('reports a useful error message for missing name', () => {
      const result = validateCard(invalidCard);
      const hasNameError = result.errors.some(
        (e) => e.includes('name'),
      );
      expect(hasNameError).toBe(true);
    });

    it('rejects a completely empty object', () => {
      const result = validateCard({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(5);
    });

    it('rejects non-object input', () => {
      const result = validateCard('not an object');
      expect(result.valid).toBe(false);
    });

    it('rejects card with invalid transport type', () => {
      const card = {
        ...validCard,
        transport: { type: 'websocket' },
      };
      const result = validateCard(card);
      expect(result.valid).toBe(false);
    });

    it('rejects card with invalid authentication type', () => {
      const card = {
        ...validCard,
        authentication: { type: 'basic' },
      };
      const result = validateCard(card);
      expect(result.valid).toBe(false);
    });
  });
});
