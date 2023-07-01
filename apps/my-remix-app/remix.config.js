import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { createWatchPaths } from "@nx/remix";
import { flatRoutes } from 'remix-flat-routes';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
  serverModuleFormat: "esm",
  future: {
    v2_dev: true,
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
  routes: async defineRoutes => {
    const appDir = join(__dirname, "app");
    const routesDir = join(__dirname, "../../libs/routes/src/");
    const relativeRoutesDir = relative(appDir, routesDir);
    return flatRoutes(['routes', relativeRoutesDir], defineRoutes)
  },
  watchPaths: () => createWatchPaths(__dirname)
};