import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/serve/middleware.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node18',
});
