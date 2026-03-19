import { defineConfig } from 'tsup';
import { copyFileSync } from 'node:fs';

export default defineConfig({
  entry: ['src/index.ts', 'src/serve/middleware.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node18',
  onSuccess: async () => {
    copyFileSync(
      'src/schema/server-card.schema.json',
      'dist/server-card.schema.json',
    );
  },
});
