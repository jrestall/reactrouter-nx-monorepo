import { relative } from 'node:path';
import { existsSync } from 'node:fs';
import { flatRoutes } from '@react-router/fs-routes';
import { type RouteConfig } from '@react-router/dev/routes';
import { createGlobPatternsForDependencies } from '@nrwl/react/tailwind';

const routeConfigs = createGlobPatternsForDependencies(
  __dirname,
  '/src/routes/',
)
  .map((dir) => relative(__dirname, dir))
  .map((dir) => {
    console.log(dir);
    return flatRoutes({ rootDirectory: dir });
  });

const resolvedRoutes = [
  ...(await flatRoutes()),
  ...(await Promise.all(routeConfigs)).flat(),
];

console.log(JSON.stringify(resolvedRoutes, null, 2));

// Fix the 'file' property of the routes since it is cut off with:
// file: file.slice(appDirectory.length + 1),
resolvedRoutes.forEach((route) => {
  if (!route.file || route.file.startsWith('routes'))
    return;

  const fix = route.id?.slice(0, 31);
  route.file = fix + route.file;
});

console.log(JSON.stringify(resolvedRoutes, null, 2));

export const routes: RouteConfig = resolvedRoutes;
