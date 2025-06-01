import { remixRoutesOptionAdapter } from '@react-router/remix-routes-option-adapter';
import {
  getFeatureRouteDirectories,
  normalizeRouteManifestPaths,
} from 'package-typegen-plugin';
import path from 'node:path';
import { flatRoutes } from 'remix-flat-routes';

export default remixRoutesOptionAdapter(async (defineRoutes) => {
  const packageRouteDirs = await getFeatureRouteDirectories(__dirname);
  const routeDirs = [...packageRouteDirs, path.resolve(__dirname, 'routes')];

  console.log(`Generating routes for: ${routeDirs}`);

  const routeManifest = flatRoutes(routeDirs, defineRoutes, {
    appDir: '',
    ignoredRouteFiles: ['**/.*'], // Ignore dot files (like .DS_Store)
  });

  const normalizedManifest = normalizeRouteManifestPaths(routeManifest);

  console.log(
    `Generated routes: ${JSON.stringify(normalizedManifest, null, 2)}`,
  );

  return normalizedManifest;
});
