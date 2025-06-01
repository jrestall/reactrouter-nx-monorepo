import { promisify } from 'node:util';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { exec } from 'child_process';
import watcher from '@parcel/watcher';
import { workspaceRoot, type ProjectGraph } from '@nx/devkit';
import { ROUTE_DIR_NAME } from './routes';

const execAsync = promisify(exec);

const TYPEGEN_COMMAND = 'react-router typegen';
const DEBOUNCE_DELAY_MS = 1000;

// Run the typegen command for the specified package
export async function runTypegen(pkg: string, graph: ProjectGraph) {
  const pkgRoot = path.resolve(workspaceRoot, graph.nodes[pkg].data.root);
  const projectTypesDir = path.join(pkgRoot, '.react-router');

  // Create temporary files
  const rootFilePath = path.join(pkgRoot, 'root.tsx');
  const configFilePath = path.join(pkgRoot, 'react-router.config.ts');
  const routesFilePath = path.join(pkgRoot, 'routes.ts');

  try {
    // Write temporary files used by react-router typegen
    await Promise.all([
      fs.writeFile(rootFilePath, 'export default {}'),
      fs.writeFile(configFilePath, `export default { appDirectory: "." };`),
      fs.writeFile(
        routesFilePath,
        `import { flatRoutes } from '@react-router/fs-routes';\n` +
          `export default flatRoutes({ rootDirectory: "${ROUTE_DIR_NAME}" });`,
      ),
    ]);

    // Run react-router typegen for the project
    console.log(`Running typegen for package: ${pkg}`);
    await execAsync(TYPEGEN_COMMAND, { cwd: pkgRoot });

    // Add a default root.tsx file to the generated types directory to avoid typescript errors
    const rootPath = path.join(projectTypesDir, 'root.tsx');
    await fs.writeFile(rootPath, 'export default {}');
  } catch (error) {
    console.error(`Typegen failed for ${pkg}:`, error);
  } finally {
    // Cleanup the temporary files
    await Promise.all([
      fs.rm(rootFilePath, { force: true }),
      fs.rm(configFilePath, { force: true }),
      fs.rm(routesFilePath, { force: true }),
    ]);
  }
}

export function createDebouncedTypegen(
  pkg: string,
  dir: string,
  graph: ProjectGraph,
  snapshotPath: string,
) {
  let timeoutId: NodeJS.Timeout | undefined = undefined;
  let isRunning = false;
  let shouldRunAgain = false;

  async function doWork() {
    isRunning = true;
    shouldRunAgain = false;
    try {
      await runTypegen(pkg, graph);
      await watcher.writeSnapshot(dir, snapshotPath);
    } catch (e) {
      console.error(`Error in typegen for ${pkg}:`, e);
    } finally {
      isRunning = false;
      if (shouldRunAgain) {
        // If a new event arrived during the run, do one more
        shouldRunAgain = false;
        doWork();
      }
    }
  }

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (isRunning) {
        // Already running: schedule a follow‐on run
        shouldRunAgain = true;
      } else {
        doWork();
      }
    }, DEBOUNCE_DELAY_MS);
  };
}
