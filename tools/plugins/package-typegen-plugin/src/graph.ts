import {
  createProjectGraphAsync,
  readCachedProjectGraph,
  type ProjectGraph,
} from '@nx/devkit';

let projectGraph: ProjectGraph | null = null;
export async function retrieveOrCreateProjectGraph(): Promise<ProjectGraph | null> {
  if (projectGraph) {
    return projectGraph;
  }

  try {
    projectGraph = readCachedProjectGraph();
  } catch {
    // ignore
  }

  try {
    if (!projectGraph) {
      projectGraph = await createProjectGraphAsync({
        exitOnError: false,
        resetDaemonClient: true,
      });
    }
  } catch {
    // ignore
  }

  return projectGraph;
}