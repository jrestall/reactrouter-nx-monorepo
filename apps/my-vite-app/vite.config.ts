import { unstable_vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { createWatchPaths } from '@nx/remix';
import { DefineRoutesFunction, flatRoutes } from 'remix-flat-routes';

const __dirname = dirname(fileURLToPath(import.meta.url));

const remixConfig = {
  routes: async (defineRoutes: DefineRoutesFunction) => {
    const appDir = join(__dirname, 'app');
    const routesDir = join(__dirname, '../../libs/routes/src/');
    const relativeRoutesDir = relative(appDir, routesDir);
    return flatRoutes(['routes', relativeRoutesDir], defineRoutes);
  },
  watchPaths: () => createWatchPaths(__dirname),
};

export default defineConfig({
  plugins: [remix(remixConfig), tsconfigPaths()],
});
