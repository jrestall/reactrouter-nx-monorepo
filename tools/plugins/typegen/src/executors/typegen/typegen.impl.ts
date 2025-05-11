import { logger, output, type PromiseExecutor } from '@nx/devkit';
import type { TypegenExecutorSchema } from './schema';
import { spawn } from 'node:child_process';
import { promises as fs, existsSync } from 'node:fs';
import * as path from 'node:path';

const runExecutor: PromiseExecutor<TypegenExecutorSchema> = async (
  options,
  context,
) => {
  if (!context.projectName) {
    logger.error('Project name is not defined in the context.');
    return { success: false };
  }

  const root = context.projectGraph.nodes[context.projectName].data.root;
  const projectRoot = path.join(context.root, root);
  const projectTypesDir = path.join(projectRoot, '.react-router');
  const routesDir = path.join(projectRoot, 'src', 'routes');

  // Log the paths
  output.log({
    title: `Running typegen for ${context.projectName}`,
    bodyLines: [projectRoot],
  });

  try {
    if (!context.projectName.includes('feature-') || !existsSync(routesDir)) {
      output.warn({
        title: `Skipping typegen. Routes directory does not exist at: ${routesDir}`,
      });
      return { success: true };
    }

    // Temporary files
    const rootFilePath = path.join(projectRoot, 'root.tsx');
    const configFilePath = path.join(projectRoot, 'react-router.config.ts');
    const routesFilePath = path.join(projectRoot, 'routes.ts');

    // Write temporary files
    await Promise.all([
      fs.writeFile(rootFilePath, 'export default {}'),
      fs.writeFile(configFilePath, `export default { appDirectory: "." };`),
      fs.writeFile(
        routesFilePath,
        `import { flatRoutes } from '@react-router/fs-routes';\n` +
          `export default flatRoutes({ rootDirectory: "${path.join('src', 'routes')}" });`,
      ),
    ]);

    // Run react-router typegen for the project
    const command = `react-router typegen`;
    await new Promise<void>((resolve) => {
      const commandExec = spawn(command, {
        stdio: 'inherit',
        shell: true,
        cwd: projectRoot,
        windowsHide: false,
      });
      commandExec.on('close', () => {
        resolve();
      });
    });

    // Add a default root.tsx file to the generated types directory
    const rootPath = path.join(projectTypesDir, 'root.tsx');
    await fs.writeFile(rootPath, 'export default {}');

    // Cleanup the temporary files
    await Promise.all([
      fs.rm(rootFilePath, { force: true }),
      fs.rm(configFilePath, { force: true }),
      fs.rm(routesFilePath, { force: true }),
    ]);
  } catch (error) {
    console.error(`Typegen task failed: ${error}`);
    return { success: false };
  }

  return { success: true };
};

export default runExecutor;
