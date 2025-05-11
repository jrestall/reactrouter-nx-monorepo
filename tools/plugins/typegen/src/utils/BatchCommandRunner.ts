import { output } from '@nx/devkit';
import { spawn } from 'node:child_process';
import { BatchFunctionRunner } from 'nx/src/command-line/watch/watch';

const DEFAULT_PROJECT_NAME_ENV = 'NX_PROJECT_NAME';
const DEFAULT_FILE_CHANGES_ENV = 'NX_FILE_CHANGES';

export class BatchCommandRunner extends BatchFunctionRunner {
  constructor(
    private command: string,
    private projectNameEnv: string = DEFAULT_PROJECT_NAME_ENV,
    private fileChangesEnv: string = DEFAULT_FILE_CHANGES_ENV,
  ) {
    super((projects, files) => {
      // process all pending commands together
      const envs = this.createCommandEnvironments(projects, files);

      return this.run(envs);
    });
  }

  private createCommandEnvironments(
    projects: Set<string>,
    files: Set<string>,
  ): Record<string, string>[] {
    const commandsToRun = [];

    if (projects.size > 0) {
      projects.forEach((projectName) => {
        commandsToRun.push({
          [this.projectNameEnv]: projectName,
          [this.fileChangesEnv]: Array.from(files).join(' '),
        });
      });
    } else {
      commandsToRun.push({
        [this.projectNameEnv]: '',
        [this.fileChangesEnv]: Array.from(files).join(' '),
      });
    }

    return commandsToRun;
  }

  async run(envs: Record<string, string>[]) {
    this._verbose &&
      output.logSingleLine(
        'about to run commands with these environments: ' +
          JSON.stringify(envs),
      );

    return Promise.all(
      envs.map((env) => {
        return new Promise<void>((resolve, reject) => {
          const commandExec = spawn(this.command, {
            stdio: ['inherit', 'inherit', 'inherit'],
            shell: true,
            cwd: process.cwd(),
            env: {
              ...process.env,
              [this.projectNameEnv]: env[this.projectNameEnv],
              [this.fileChangesEnv]: env[this.fileChangesEnv],
            },
            windowsHide: false,
          });
          commandExec.on('close', () => {
            resolve();
          });
          commandExec.on('exit', () => {
            resolve();
          });
        });
      }),
    ).then((r) => {
      this._verbose &&
        output.logSingleLine('running complete, processing the next batch');
      return r;
    });
  }
}
