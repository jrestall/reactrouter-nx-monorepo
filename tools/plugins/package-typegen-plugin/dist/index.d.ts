import { Plugin } from 'vite';

/**
 * Vite plugin for generating React Router types for packages in a monorepo.
 * It watches for changes in route dirs and generates types accordingly.
 *
 * @returns {Plugin} The Vite plugin.
 */
declare function packageTypegen(): Plugin;

interface RouteManifestEntry {
    path?: string;
    index?: boolean;
    caseSensitive?: boolean;
    id: string;
    parentId?: string;
    file: string;
}
/**
 * Returns an array of route directories for feature packages based on the project's dependencies.
 *
 * @param {string} dirname The absolute path to the React Router project, typically `__dirname`.
 */
declare function getFeatureRouteDirectories(dirname: string): Promise<string[]>;
/**
 * Normalizes the route manifest by stripping everything before the '/routes/' prefix from paths.
 *
 * @param {Record<string, RouteManifestEntry>} routes The original route manifest.
 * @returns {Record<string, RouteManifestEntry>} The normalized route manifest.
 */
declare function normalizeRouteManifestPaths(routes: Record<string, RouteManifestEntry>): Record<string, RouteManifestEntry>;

export { getFeatureRouteDirectories, normalizeRouteManifestPaths, packageTypegen };
