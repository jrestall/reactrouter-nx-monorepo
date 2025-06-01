import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { packageTypegen } from 'package-typegen-plugin';

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths(), packageTypegen()],
});
