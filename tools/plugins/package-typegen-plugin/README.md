## Vite Plugin: packageTypegen

The `packageTypegen` Vite plugin automatically generates React Router types for feature packages in an Nx monorepo. It watches for changes in route directories and triggers type generation as needed, ensuring your types stay up-to-date during development and build.

### Features

- **Automatic Type Generation:** Runs typegen for all feature packages with routes on build.
- **File Watching:** In dev mode, watches `src/routes` directories and regenerates types on changes.
- **Snapshot Support:** Writes out route snapshots on server close for performance, so can skip typegen on next launch if no changes.

### Usage

Add the plugin to your Vite config:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { packageTypegen } from 'package-typegen-plugin';

export default defineConfig({
  plugins: [
    packageTypegen(),
    // ...other plugins
  ],
});
```

No additional configuration is required. The plugin will automatically detect feature packages and manage type generation.

### How it Works

- On **build**, it generates types for all feature packages with routes.
- In **dev**, it sets up file watchers on each feature package’s `src/routes` directory and regenerates types on changes.
- On server shutdown, it unsubscribes all watchers and writes route snapshots for fast startup next time.

---

For more details, see the source code in [`src/plugin.ts`](./src/plugin.ts).

## routes.ts Configuration

To leverage the generated types and route discovery, configure your React Router app’s `routes.ts` as follows:

```typescript
import { remixRoutesOptionAdapter } from '@react-router/remix-routes-option-adapter';
import {
  getFeatureRouteDirectories,
  normalizeRouteManifestPaths,
} from 'package-typegen-plugin';
import path from 'node:path';
import { flatRoutes } from 'remix-flat-routes';

export default remixRoutesOptionAdapter(async (defineRoutes) => {
  // Discover all feature package route directories
  const packageRouteDirs = await getFeatureRouteDirectories(__dirname);
  // Include the app's own routes directory and feature packages.
  const routeDirs = [...packageRouteDirs, path.resolve(__dirname, 'routes')];

  // Generate the route manifest
  const routeManifest = flatRoutes(routeDirs, defineRoutes, {
    appDir: '', // Set if needed, otherwise can be omitted
    ignoredRouteFiles: ['**/.*'], // Ignore dot files (like .DS_Store)
  });

  // Normalize manifest paths to strip absolute file path
  return normalizeRouteManifestPaths(routeManifest);
});
```

This setup ensures that all feature package routes and your app’s own routes are automatically discovered, normalized, and included in your React Router route manifest.

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes or new features.

## License

MIT
