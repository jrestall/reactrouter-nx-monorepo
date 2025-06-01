import { workspaceRoot, readCachedProjectGraph, createProjectGraphAsync } from '@nx/devkit';
import path2, { relative, resolve } from 'path';
import { existsSync, promises } from 'fs';
import { createProjectRootMappings, findProjectForPath } from 'nx/src/project-graph/utils/find-project-for-path.js';
import { findAllProjectNodeDependencies } from 'nx/src/utils/project-graph-utils.js';
import { promisify } from 'util';
import { exec } from 'child_process';
import watcher2 from '@parcel/watcher';

// src/graph.ts
var projectGraph = null;
async function retrieveOrCreateProjectGraph() {
  if (projectGraph) {
    return projectGraph;
  }
  try {
    projectGraph = readCachedProjectGraph();
  } catch {
  }
  try {
    if (!projectGraph) {
      projectGraph = await createProjectGraphAsync({
        exitOnError: false,
        resetDaemonClient: true
      });
    }
  } catch {
  }
  return projectGraph;
}
var ROUTE_DIR_NAME = `src${path2.sep}routes`;
async function getFeatureRouteDirectories(dirname) {
  const graph = await retrieveOrCreateProjectGraph();
  if (!graph) {
    throw new Error("Project graph not found. Ensure Nx is set up correctly.");
  }
  const featurePackages = await getFeaturePackagesWithRoutes(graph, dirname);
  return featurePackages.map(({ routeDir }) => routeDir);
}
async function getFeaturePackagesWithRoutes(graph, currentDir) {
  const projectRootMappings = createProjectRootMappings(graph.nodes);
  currentDir ??= process.cwd();
  const projectName = findProjectForPath(
    relative(workspaceRoot, resolve(currentDir)),
    projectRootMappings
  );
  if (!projectName) {
    throw new Error(
      `Project not found for path: ${currentDir}. Check the project configuration.`
    );
  }
  const deps = findAllProjectNodeDependencies(projectName, graph);
  const routeDirs = [];
  for (const dep of deps) {
    if (!dep.includes("feature-")) continue;
    const pkgRoot = resolve(workspaceRoot, graph.nodes[dep].data.root);
    const routeDir = resolve(pkgRoot, ROUTE_DIR_NAME);
    if (existsSync(routeDir)) {
      routeDirs.push({ pkg: dep, routeDir });
    }
  }
  return routeDirs;
}
function normalizeRouteManifestPaths(routes) {
  function stripRoutesPrefix(str) {
    return str.replace(/^.*\/routes\//, "routes/");
  }
  const processedRoutes = {};
  for (const [key, value] of Object.entries(routes)) {
    const newKey = stripRoutesPrefix(key);
    processedRoutes[newKey] = {
      ...value,
      id: stripRoutesPrefix(value.id),
      parentId: value.parentId ? stripRoutesPrefix(value.parentId) : value.parentId
    };
  }
  return processedRoutes;
}
var execAsync = promisify(exec);
var TYPEGEN_COMMAND = "react-router typegen";
var DEBOUNCE_DELAY_MS = 1e3;
async function runTypegen(pkg, graph) {
  const pkgRoot = path2.resolve(workspaceRoot, graph.nodes[pkg].data.root);
  const projectTypesDir = path2.join(pkgRoot, ".react-router");
  const rootFilePath = path2.join(pkgRoot, "root.tsx");
  const configFilePath = path2.join(pkgRoot, "react-router.config.ts");
  const routesFilePath = path2.join(pkgRoot, "routes.ts");
  try {
    await Promise.all([
      promises.writeFile(rootFilePath, "export default {}"),
      promises.writeFile(configFilePath, `export default { appDirectory: "." };`),
      promises.writeFile(
        routesFilePath,
        `import { flatRoutes } from '@react-router/fs-routes';
export default flatRoutes({ rootDirectory: "${ROUTE_DIR_NAME}" });`
      )
    ]);
    console.log(`Running typegen for package: ${pkg}`);
    await execAsync(TYPEGEN_COMMAND, { cwd: pkgRoot });
    const rootPath = path2.join(projectTypesDir, "root.tsx");
    await promises.writeFile(rootPath, "export default {}");
  } catch (error) {
    console.error(`Typegen failed for ${pkg}:`, error);
  } finally {
    await Promise.all([
      promises.rm(rootFilePath, { force: true }),
      promises.rm(configFilePath, { force: true }),
      promises.rm(routesFilePath, { force: true })
    ]);
  }
}
function createDebouncedTypegen(pkg, dir, graph, snapshotPath) {
  let timeoutId = void 0;
  let isRunning = false;
  let shouldRunAgain = false;
  async function doWork() {
    isRunning = true;
    shouldRunAgain = false;
    try {
      await runTypegen(pkg, graph);
      await watcher2.writeSnapshot(dir, snapshotPath);
    } catch (e) {
      console.error(`Error in typegen for ${pkg}:`, e);
    } finally {
      isRunning = false;
      if (shouldRunAgain) {
        shouldRunAgain = false;
        doWork();
      }
    }
  }
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (isRunning) {
        shouldRunAgain = true;
      } else {
        doWork();
      }
    }, DEBOUNCE_DELAY_MS);
  };
}
function getSnapshotPath(pkg) {
  const safePkg = pkg.replace(/\//g, "__").replace(/@/g, "");
  return path2.join(
    workspaceRoot,
    "node_modules",
    ".cache",
    safePkg,
    "snapshot.txt"
  );
}
async function setupWatcher(pkg, routeDir, graph) {
  const snapshotPath = getSnapshotPath(pkg);
  const dir = resolve(routeDir);
  await promises.mkdir(path2.dirname(snapshotPath), { recursive: true });
  const debouncedTypegen = createDebouncedTypegen(
    pkg,
    dir,
    graph,
    snapshotPath
  );
  if (existsSync(snapshotPath)) {
    const events = await watcher2.getEventsSince(dir, snapshotPath);
    handleEvents(events, debouncedTypegen);
  } else {
    runTypegen(pkg, graph).then(async () => {
      await watcher2.writeSnapshot(dir, snapshotPath);
    }).catch((err) => console.error(`Error running typegen for ${pkg}:`, err));
  }
  const subscription = await watcher2.subscribe(dir, async (err, events) => {
    if (err) {
      console.error(err);
      return;
    }
    handleEvents(events, debouncedTypegen);
  });
  return subscription;
}
function handleEvents(events, debouncedTypegen) {
  if (!events || events.length === 0) return;
  const relevantEvents = events.filter(
    (event) => (event.type === "create" || event.type === "delete") && (event.path.endsWith(".tsx") || event.path.endsWith(".ts"))
  );
  if (relevantEvents.length > 0) {
    debouncedTypegen();
  }
}
function packageTypegen() {
  const graphPromise = retrieveOrCreateProjectGraph();
  let isBuild = false;
  let subscriptions = [];
  return {
    name: "package-typegen",
    config(_, { command }) {
      if (command === "build") isBuild = true;
    },
    async buildStart() {
      if (!isBuild) return;
      const graph = await graphPromise;
      if (!graph) {
        console.warn("No project graph found. Package typegen will not run.");
        return;
      }
      const featurePackages = await getFeaturePackagesWithRoutes(graph);
      await Promise.all(
        featurePackages.map(({ pkg }) => runTypegen(pkg, graph))
      );
    },
    async configureServer(server) {
      const graph = await graphPromise;
      if (!graph) {
        console.warn("No project graph found. Package typegen will not run.");
        return;
      }
      const featurePackages = await getFeaturePackagesWithRoutes(graph);
      for (const { pkg, routeDir } of featurePackages) {
        const subscription = await setupWatcher(pkg, routeDir, graph);
        subscriptions.push(subscription);
      }
      server.watcher.on("close", async () => {
        for (const sub of subscriptions) {
          try {
            await sub.unsubscribe();
          } catch (e) {
            console.warn("Failed to unsubscribe watcher:", e);
          }
        }
        for (const { pkg, routeDir } of featurePackages) {
          const snapshotPath = getSnapshotPath(pkg);
          await watcher2.writeSnapshot(routeDir, snapshotPath);
        }
      });
    }
  };
}

export { getFeatureRouteDirectories, normalizeRouteManifestPaths, packageTypegen };
