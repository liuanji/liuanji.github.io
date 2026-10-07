import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Same rule as the gpu-status Worker's file names.
const FILE_NAME = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const WAIT_FOR_FIRST_PUBLISH_MS = 30_000;

// The simulator needs a few seconds to build its history; until it has
// published once, hold requests instead of answering 404.
async function waitForFirstPublish(filesDir) {
  const deadline = Date.now() + WAIT_FOR_FIRST_PUBLISH_MS;
  while (Date.now() < deadline) {
    try {
      await access(path.join(filesDir, 'overview.json'));
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

// Dev-only stand-in for the gpu-status Worker, enabled by GPU_STATUS_PREVIEW=1
// (`npm run dev:top`). It runs servermonitor's simulator, which publishes
// made-up but realistic files every 30 s, and serves them at
// /__gpu-status/files/<name>, the same paths the Worker uses.
export default function gpuStatusPreview() {
  return {
    name: 'gpu-status-preview',
    apply: 'serve',
    configureServer(server) {
      if (!process.env.GPU_STATUS_PREVIEW) return;
      const workDir = path.join(tmpdir(), 'gpu-status-preview');
      const filesDir = path.join(workDir, 'files');
      const python = process.env.PYTHON || 'python3';
      const sampler = spawn(python, ['-m', 'servermonitor.sample', workDir, '--live'], {
        cwd: path.resolve(server.config.root, 'servermonitor'),
        env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
        stdio: 'inherit',
      });
      sampler.on('error', (error) => {
        server.config.logger.error(`[gpu-status-preview] could not run ${python}: ${error.message}`);
      });
      const stop = () => sampler.kill();
      server.httpServer?.once('close', stop);
      process.once('exit', stop);

      server.middlewares.use('/__gpu-status/files', async (request, response) => {
        const name = (request.url ?? '').split('?')[0].replace(/^\//, '');
        try {
          if (!FILE_NAME.test(name)) throw Object.assign(new Error('bad name'), { code: 'ENOENT' });
          await waitForFirstPublish(filesDir);
          const body = await readFile(path.join(filesDir, `${name}.json`));
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.setHeader('Cache-Control', 'no-store');
          response.end(body);
        } catch (error) {
          response.statusCode = error.code === 'ENOENT' ? 404 : 500;
          response.end(JSON.stringify({ error: response.statusCode === 404 ? 'not found' : 'unavailable' }));
        }
      });
    },
  };
}
