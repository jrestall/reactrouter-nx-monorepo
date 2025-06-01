import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  entry: { index: './src/index.ts' },
  format: ['esm'],
  dts: true,
  treeshake: true,
  cjsInterop: true,
  bundle: true,
  skipNodeModulesBundle: true,
});
