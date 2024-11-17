import { flatRoutes } from '@react-router/fs-routes';
import { type RouteConfig } from '@react-router/dev/routes';
import { createGlobPatternsForDependencies } from '@nrwl/react/tailwind';

const routeConfigs = createGlobPatternsForDependencies(
  __dirname,
  '/src/routes/',
).map((rootDirectory) => flatRoutes({ rootDirectory }));

const resolvedRoutes = [
  ...(await flatRoutes()),
  ...(await Promise.all(routeConfigs)).flat(),
];

console.log(JSON.stringify(resolvedRoutes, null, 2));

// Fix the 'file' property of the package routes since they are cut off with:
// file: file.slice(appDirectory.length + 1),
resolvedRoutes.forEach((route) => {
  if (!route.id || !route.file || route.file.startsWith('routes')) return;
  route.file = `${route.id}.tsx`;
});

console.log(JSON.stringify(resolvedRoutes, null, 2));

export const routes: RouteConfig = resolvedRoutes;
