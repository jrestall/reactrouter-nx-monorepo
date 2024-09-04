import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { join, relative } from 'path';
import fs from 'node:fs';
import { createWatchPaths } from '@nx/remix';
import { DefineRoutesFunction, flatRoutes } from 'remix-flat-routes';
import { createGlobPatternsForDependencies } from '@nrwl/react/tailwind';

const remixConfig = {
  routes: (defineRoutes: DefineRoutesFunction) => {
    const appDir = join(__dirname, 'app');
    const packageDirs = createGlobPatternsForDependencies(__dirname, "/src/routes/");

    const routeDirs = ["routes"];
    for (const dir of packageDirs) {
      // check if referenced package has a routes folder
      if (!fs.existsSync(dir)) continue;
      // make relative to app dir 
      const relativeRoutesDir = relative(appDir, dir);

      routeDirs.push(relativeRoutesDir);
    }

    console.info("Route Folders: ");
    console.info(routeDirs);

    return flatRoutes(routeDirs, defineRoutes);
  },
  watchPaths: () => createWatchPaths(__dirname),
};

export default defineConfig({
  plugins: [remix(remixConfig), tsconfigPaths()],
});
