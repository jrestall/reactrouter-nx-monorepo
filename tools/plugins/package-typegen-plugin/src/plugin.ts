import { Plugin } from 'vite';
import { retrieveOrCreateProjectGraph } from './graph';
import { getFeaturePackagesWithRoutes } from './routes';
import { runTypegen } from './typegen';
import { setupWatcher, getSnapshotPath } from './watcher';
import watcher from '@parcel/watcher';

/**
 * Vite plugin for generating React Router types for packages in a monorepo.
 * It watches for changes in route dirs and generates types accordingly.
 *
 * @returns {Plugin} The Vite plugin.
 */
export function packageTypegen() {
  const graphPromise = retrieveOrCreateProjectGraph();
  let isBuild = false;
  let subscriptions: watcher.AsyncSubscription[] = [];

  return {
    name: 'package-typegen',
    config(_, { command }) {
      if (command === 'build') isBuild = true;
    },
    async buildStart() {
      if (!isBuild) return;
      const graph = await graphPromise;
      if (!graph) {
        console.warn('No project graph found. Package typegen will not run.');
        return;
      }

      const featurePackages = await getFeaturePackagesWithRoutes(graph);
      await Promise.all(
        featurePackages.map(({ pkg }) => runTypegen(pkg, graph)),
      );
    },
    async configureServer(server) {
      const graph = await graphPromise;
      if (!graph) {
        console.warn('No project graph found. Package typegen will not run.');
        return;
      }

      const featurePackages = await getFeaturePackagesWithRoutes(graph);
      for (const { pkg, routeDir } of featurePackages) {
        const subscription = await setupWatcher(pkg, routeDir, graph);
        subscriptions.push(subscription);
      }

      // Cleanup and write snapshots before server closes
      server.watcher.on('close', async () => {
        // First, unsubscribe all watchers:
        for (const sub of subscriptions) {
          try {
            await sub.unsubscribe();
          } catch (e) {
            console.warn('Failed to unsubscribe watcher:', e);
          }
        }

        // Then write out final snapshots
        for (const { pkg, routeDir } of featurePackages) {
          const snapshotPath = getSnapshotPath(pkg);
          await watcher.writeSnapshot(routeDir, snapshotPath);
        }
      });
    },
  } as Plugin;
}