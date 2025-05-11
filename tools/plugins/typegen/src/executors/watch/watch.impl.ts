import {
  daemonClient,
  isDaemonEnabled,
  type ChangedFile,
} from 'nx/src/daemon/client/client';
import { output, type ExecutorContext, type PromiseExecutor } from '@nx/devkit';
import type { TypegenWatchExecutorSchema } from './schema';
import { BatchCommandRunner } from '../../utils/BatchCommandRunner';
import path from 'node:path';
import { debounce } from 'lodash';

export default async function* startWatcher(
  options: TypegenWatchExecutorSchema,
  context: ExecutorContext,
): AsyncGenerator<{ success: boolean }> {
  // TODO:Initial typegen

  // Watch for changes
  if (isDaemonEnabled()) {
    output.log({
      title: `Watching for route changes in ${context.projectName}`,
    });

    const isWindows = process.platform === 'win32';
    const varProjectName = isWindows ? '%NX_PROJECT_NAME%' : '$NX_PROJECT_NAME';
    const command = `nx run ${varProjectName}:typegen --exclude=${context.projectName}`;

    const unregisterFileWatcher = await createFileWatcher(
      context.projectName,
      command,
    );
    process.on('exit', () => unregisterFileWatcher());
    process.on('SIGINT', () => process.exit());

    // Keep the process alive to wait for file changes
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Sleep for 1 second
    }
  } else {
    output.warn({
      title:
        'Nx Daemon is not enabled. Route typegen will not run on route file changes.',
    });
  }
  return { success: true };
}

function createFileWatcher(
  projectToWatch: string | undefined,
  command: string,
) {
  const batchQueue = new BatchCommandRunner(command);

  // Store accumulated changes
  let accumulatedChanges: {
    changedProjects: string[];
    changedFiles: ChangedFile[];
  } = {
    changedProjects: [],
    changedFiles: [],
  };

  // Debounced function to process accumulated changes such as
  // file renames that cause both a delete and create event.
  const processChanges = debounce(
    () => {
      const { changedProjects, changedFiles } = accumulatedChanges;
      // Batch regenerate route types for changed projects
      batchQueue.enqueue(changedProjects, changedFiles);

      // Reset accumulated changes
      accumulatedChanges = { changedProjects: [], changedFiles: [] };
    },
    1000,
    { leading: false, trailing: true },
  );

  return daemonClient.registerFileWatcher(
    {
      watchProjects: projectToWatch ? [projectToWatch] : 'all',
      includeDependentProjects: true,
      includeGlobalWorkspaceFiles: false,
    },
    (err, result) => {
      if (err === 'closed') {
        output.error({
          title: 'Watch connection closed',
          bodyLines: [
            'The daemon has closed the connection to this watch process.',
            'Please restart your watch command.',
          ],
        });
        process.exit(1);
      } else if (err !== null) {
        output.error({
          title: 'Typegen watch error',
          bodyLines: [
            'An error occurred during the watch process:',
            err.message,
          ],
        });
      }

      if (!result || !hasRouteChanges(result.changedFiles)) return;

      output.logSingleLine(
        `Detected route changes in ${JSON.stringify(result.changedFiles)}`,
      );

      // Accumulate changes
      accumulatedChanges.changedProjects.push(...result.changedProjects);
      accumulatedChanges.changedFiles.push(...result.changedFiles);

      // Trigger the debounced processing function
      processChanges();
    },
  );
}

function hasRouteChanges(changedFiles: ChangedFile[]): boolean {
  return changedFiles.some(
    (file) =>
      (file.type == 'create' || file.type === 'delete') &&
      (file.path.endsWith('.tsx') || file.path.endsWith('.ts')) &&
      file.path.includes(`src${path.sep}routes`),
  );
}
