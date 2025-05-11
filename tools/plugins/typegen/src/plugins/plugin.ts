import {
  createNodesFromFiles,
  readJsonFile,
  type CreateNodesResult,
  type CreateNodesV2,
  type TargetConfiguration,
} from '@nx/devkit';
import { dirname } from 'path';

export const createNodesV2: CreateNodesV2 = [
  '**/*/package.json',
  async (packageJsonPaths, options, context) => {
    return await createNodesFromFiles(
      (packageJsonPath) => createNodesInternal(packageJsonPath),
      packageJsonPaths,
      options,
      context,
    );
  },
];

function createNodesInternal(packageJsonPath: string): CreateNodesResult {
  const projectRoot = dirname(packageJsonPath);
  const packageJson = readJsonFile(packageJsonPath);
  const projectName = packageJson.name;

  if (!projectName) {
    throw new Error(`Package name not found in ${packageJsonPath}`);
  }

  const targets: Record<string, TargetConfiguration> = {};

  // Add typegen task to feature libraries
  if (projectName.includes('feature-')) {
    targets['typegen'] = typegenTarget(projectRoot);
  }
  // Add typegen-watch task to apps
  else if (projectRoot.includes('apps')) {
    targets['typegen-watch'] = typegenWatchTarget(projectRoot);
  }

  return {
    projects: {
      [projectRoot]: {
        targets,
      },
    },
  };
}

function typegenTarget(projectRoot: string): TargetConfiguration {
  const target: TargetConfiguration = {
    cache: false,
    executor: '@remix-nx-monorepo/typegen:typegen',
    options: { cwd: projectRoot },
    metadata: {
      technologies: ['react-router'],
      description: 'Runs React Router typegen',
    },
  };

  return target;
}

function typegenWatchTarget(
  projectRoot: string,
): TargetConfiguration {
  const target: TargetConfiguration = {
    cache: false,
    continuous: true,
    executor: '@remix-nx-monorepo/typegen:watch',
    options: { cwd: projectRoot },
    metadata: {
      technologies: ['react-router'],
      description: 'Runs React Router typegen on changes to package routes',
    },
  };

  return target;
}
