import { spawn } from 'node:child_process';

export async function execAsync(command: string, cwd: string): Promise<void> {
  // Must be non-blocking async to allow spinner to render
  return new Promise<void>((resolve) => {
    const commandExec = spawn(command, {
      stdio: 'inherit',
      shell: true,
      cwd,
      windowsHide: false,
    });
    commandExec.on('close', () => {
      resolve();
    });
  });
}
