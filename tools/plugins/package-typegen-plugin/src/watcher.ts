import path, { resolve } from 'node:path';
import { existsSync, promises as fs } from 'node:fs';
import watcher from '@parcel/watcher';
import { workspaceRoot, type ProjectGraph } from '@nx/devkit';
import { createDebouncedTypegen, runTypegen } from './typegen';

export function getSnapshotPath(pkg: string) {
  // Replace / and @ to make a safe folder name
  const safePkg = pkg.replace(/\//g, '__').replace(/@/g, '');
  return path.join(
    workspaceRoot,
    'node_modules',
    '.cache',
    safePkg,
    'snapshot.txt',
  );
}

// Set up watcher for route changes
export async function setupWatcher(
  pkg: string,
  routeDir: string,
  graph: ProjectGraph,
) {
  const snapshotPath = getSnapshotPath(pkg);
  const dir = resolve(routeDir);

  // Ensure snapshot directory exists
  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });

  // Debounced typegen function (1-second delay)
  const debouncedTypegen = createDebouncedTypegen(
    pkg,
    dir,
    graph,
    snapshotPath,
  );

  // Check for changes since last snapshot on startup (non-blocking)
  if (existsSync(snapshotPath)) {
    const events = await watcher.getEventsSince(dir, snapshotPath);
    handleEvents(events, debouncedTypegen);
  } else {
    // First run: generate types and create snapshot (non-blocking)
    runTypegen(pkg, graph)
      .then(async () => {
        await watcher.writeSnapshot(dir, snapshotPath);
      })
      .catch((err) => console.error(`Error running typegen for ${pkg}:`, err));
  }

  // Watch for future changes
  const subscription = await watcher.subscribe(dir, async (err, events) => {
    if (err) {
      console.error(err);
      return;
    }

    handleEvents(events, debouncedTypegen);
  });

  return subscription;
}

function handleEvents(events: watcher.Event[], debouncedTypegen: () => void) {
  if (!events || events.length === 0) return;

  // Filter events to only those that are relevant for type generation
  // (create or delete .tsx/.ts files)
  const relevantEvents = events.filter(
    (event) =>
      (event.type === 'create' || event.type === 'delete') &&
      (event.path.endsWith('.tsx') || event.path.endsWith('.ts')),
  );

  if (relevantEvents.length > 0) {
    debouncedTypegen();
  }
}
