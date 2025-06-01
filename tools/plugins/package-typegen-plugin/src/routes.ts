import path, { resolve, relative } from 'node:path';
import { existsSync } from 'node:fs';
import { workspaceRoot, type ProjectGraph } from '@nx/devkit';
import {
  createProjectRootMappings,
  findProjectForPath,
} from 'nx/src/project-graph/utils/find-project-for-path.js';
import { findAllProjectNodeDependencies } from 'nx/src/utils/project-graph-utils.js';
import { retrieveOrCreateProjectGraph } from './graph';

export const ROUTE_DIR_NAME = `src${path.sep}routes`;

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
export async function getFeatureRouteDirectories(dirname: string): Promise<string[]> {
  const graph = await retrieveOrCreateProjectGraph();
  if (!graph) {
    throw new Error('Project graph not found. Ensure Nx is set up correctly.');
  }

  const featurePackages = await getFeaturePackagesWithRoutes(graph, dirname);
  return featurePackages.map(({ routeDir }) => routeDir);
}

export async function getFeaturePackagesWithRoutes(
  graph: ProjectGraph,
  currentDir?: string,
) {
  const projectRootMappings = createProjectRootMappings(graph.nodes);
  currentDir ??= process.cwd();
  const projectName = findProjectForPath(
    relative(workspaceRoot, resolve(currentDir)),
    projectRootMappings,
  );

  if (!projectName) {
    throw new Error(
      `Project not found for path: ${currentDir}. Check the project configuration.`,
    );
  }

  const deps = findAllProjectNodeDependencies(projectName, graph);

  const routeDirs = [];
  for (const dep of deps) {
    // Only consider feature packages
    if (!dep.includes('feature-')) continue;
    // Ensure the package has a ROUTE_DIR_NAME directory e.g. `src/routes`
    const pkgRoot = resolve(workspaceRoot, graph.nodes[dep].data.root);
    const routeDir = resolve(pkgRoot, ROUTE_DIR_NAME);
    if (existsSync(routeDir)) {
      routeDirs.push({ pkg: dep, routeDir });
    }
  }

  return routeDirs;
}

/**
 * Normalizes the route manifest by stripping everything before the '/routes/' prefix from paths.
 *
 * @param {Record<string, RouteManifestEntry>} routes The original route manifest.
 * @returns {Record<string, RouteManifestEntry>} The normalized route manifest.
 */
export function normalizeRouteManifestPaths(
  routes: Record<string, RouteManifestEntry>,
) {
  function stripRoutesPrefix(str: string) {
    return str.replace(/^.*\/routes\//, 'routes/');
  }

  const processedRoutes: Record<string, RouteManifestEntry> = {};
  for (const [key, value] of Object.entries(routes)) {
    const newKey = stripRoutesPrefix(key);
    processedRoutes[newKey] = {
      ...value,
      id: stripRoutesPrefix(value.id),
      parentId: value.parentId
        ? stripRoutesPrefix(value.parentId)
        : value.parentId,
    };
  }

  return processedRoutes;
}
