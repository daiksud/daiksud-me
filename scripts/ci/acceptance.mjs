import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serveBuild } from '../../tests/acceptance/server.mjs';

async function runAcceptance(previewUrl) {
  const execute = promisify(execFile);
  const outputRoot = 'test-results/acceptance';
  const local = await serveBuild();
  try {
    await mkdir(outputRoot, { recursive: true });
    const commands = [
      [process.execPath, ['--run', 'test:integration'], 'integration'],
      [process.execPath, ['tests/acceptance/reader.browser.mjs', local.url], 'local'],
      ...(previewUrl ? [[process.execPath, ['tests/acceptance/reader.browser.mjs', previewUrl], 'preview']] : []),
    ];
    for (const [index, [command, args, label]] of commands.entries()) {
      let result;
      const started = Date.now();
      try {
        result = await execute(command, args, {
          timeout: label === 'integration' ? 180_000 : 120_000, maxBuffer: 8 * 1024 * 1024,
          env: { ...process.env, ACCEPTANCE_ARTIFACT_DIR: join(outputRoot, label) },
        });
      } catch (error) {
        const details = JSON.stringify({ label, elapsedMs: Date.now() - started,
          code: error.code, signal: error.signal, killed: error.killed });
        await writeFile(join(outputRoot, `command-${index + 1}.log`),
          `${details}\n${error.stack ?? error.message}\n${error.stdout ?? ''}\n${error.stderr ?? ''}`);
        throw error;
      }
      await writeFile(join(outputRoot, `command-${index + 1}.log`), `${result.stdout}\n${result.stderr}`);
    }
  } finally {
    await local.close();
  }
}

if (import.meta.main) {
  try {
    await runAcceptance(process.argv[2]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
