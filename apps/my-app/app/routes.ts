import { flatRoutes } from '@react-router/fs-routes';
import { type RouteConfig } from '@react-router/dev/routes';
import { createProjectGraphAsync, workspaceRoot } from '@nx/devkit';
import {
  createProjectRootMappings,
  findProjectForPath,
} from 'nx/src/project-graph/utils/find-project-for-path';
import { findAllProjectNodeDependencies } from 'nx/src/utils/project-graph-utils';
import { relative, resolve, sep } from 'path';

const routePaths = await createRoutePaths(__dirname, `src${sep}routes`);
const routeConfigs = routePaths.map((rootDirectory) =>
  flatRoutes({ rootDirectory }),
);

const resolvedRoutes = [
  ...(await flatRoutes()),
  ...(await Promise.all(routeConfigs)).flat(),
];

// Fix the 'file' property of the package routes since they are cut off with:
// file: file.slice(appDirectory.length + 1),
resolvedRoutes.forEach((route) => {
  if (!route.id || !route.file || route.file.startsWith('routes')) return;
  route.file = `${route.id}.tsx`;
});

console.log(JSON.stringify(resolvedRoutes, null, 2));

export default resolvedRoutes satisfies RouteConfig;

/**
 * Generates an array of route paths based on the project dependencies.
 *
 * @param {string} dirname The absolute path to the React Router project, typically `__dirname`.
 */
export async function createRoutePaths(
  dirname: string,
  rootDirectory: string,
): Promise<string[]> {
  const graph = await createProjectGraphAsync();
  const projectRootMappings = createProjectRootMappings(graph.nodes);
  const projectName = findProjectForPath(
    relative(workspaceRoot, dirname),
    projectRootMappings,
  );

  if (!projectName) {
    throw new Error(
      `Project not found for path: ${dirname}. Check the project configuration.`,
    );
  }

  const deps = findAllProjectNodeDependencies(projectName, graph);

  return deps.map((nodeName) =>
    resolve(workspaceRoot, graph.nodes[nodeName].data.root, rootDirectory),
  );
}
