import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Same rule as the gpu-status Worker's file names.
const FILE_NAME = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const WAIT_FOR_FIRST_PUBLISH_MS = 30_000;
// The Worker's reservation limits.
const MAX_RESERVATION_MINUTES = 240;
const MAX_RESERVATIONS_PER_USER = 2;

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  let text = '';
  for await (const chunk of request) text += chunk;
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

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
// /__gpu-status/files/<name>, the same paths the Worker uses, behind a stand-in
// /__gpu-status/login. Reservations follow the Worker's rules but live in
// memory, and the session token is simply the username.
export default function gpuStatusPreview() {
  return {
    name: 'gpu-status-preview',
    apply: 'serve',
    configureServer(server) {
      if (!process.env.GPU_STATUS_PREVIEW) return;
      const workDir = path.join(tmpdir(), 'gpu-status-preview');
      const filesDir = path.join(workDir, 'files');
      // Never serve a previous run's files while this run is still simulating.
      rmSync(filesDir, { recursive: true, force: true });
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

      const readRoster = async () => {
        await waitForFirstPublish(filesDir);
        try {
          return JSON.parse(await readFile(path.join(filesDir, 'roster.json'), 'utf8'));
        } catch {
          return { hosts: {} };
        }
      };
      let reservations = [];
      const active = () => {
        const now = Math.floor(Date.now() / 1000);
        reservations = reservations.filter((item) => item.ends_at > now);
        return reservations;
      };
      const sessionUser = (request) => (request.headers.authorization ?? '').replace(/^Bearer /, '') || null;

      // Any password signs in a username from the simulated roster.
      server.middlewares.use('/__gpu-status/login', async (request, response) => {
        const { username } = await readBody(request);
        const roster = await readRoster();
        const accounts = new Set(Object.values(roster.hosts).flatMap((host) => host.users));
        const user = [...accounts].find((name) => name.toLowerCase() === String(username ?? '').trim().toLowerCase());
        if (!user) return sendJson(response, 403, { error: 'unknown user' });
        sendJson(response, 200, { token: user, expires_at: Math.floor(Date.now() / 1000) + 86400, user });
      });

      server.middlewares.use('/__gpu-status/reservations', async (request, response) => {
        const user = sessionUser(request);
        if (!user) return sendJson(response, 401, { error: 'login required' });
        const now = Math.floor(Date.now() / 1000);
        if (request.method === 'DELETE') {
          const [host, gpu] = (request.url ?? '').replace(/^\//, '').split('/');
          reservations = active().filter((item) => !(item.host === host && item.gpu === Number(gpu) && item.user === user));
          return sendJson(response, 200, { reservations });
        }
        const { host, gpu, minutes } = await readBody(request);
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_RESERVATION_MINUTES) {
          return sendJson(response, 400, { error: 'bad minutes' });
        }
        const machine = (await readRoster()).hosts[host];
        if (!machine?.gpus.includes(gpu)) return sendJson(response, 404, { error: 'no such GPU' });
        if (!machine.users.includes(user)) {
          return sendJson(response, 403, { error: 'no account on this server', reservations: active() });
        }
        if (active().some((item) => item.host === host && item.gpu === gpu)) {
          return sendJson(response, 409, { error: 'already reserved', reservations });
        }
        if (reservations.filter((item) => item.user === user).length >= MAX_RESERVATIONS_PER_USER) {
          return sendJson(response, 409, { error: 'reservation limit reached', reservations });
        }
        reservations = [...reservations, { host, gpu, user, starts_at: now, ends_at: now + minutes * 60 }].sort(
          (a, b) => a.host.localeCompare(b.host) || a.gpu - b.gpu,
        );
        sendJson(response, 200, { reservations });
      });

      server.middlewares.use('/__gpu-status/files', async (request, response) => {
        const name = (request.url ?? '').split('?')[0].replace(/^\//, '');
        try {
          if (!FILE_NAME.test(name) || name === 'roster') throw Object.assign(new Error('bad name'), { code: 'ENOENT' });
          await waitForFirstPublish(filesDir);
          let body = await readFile(path.join(filesDir, `${name}.json`), 'utf8');
          if (name === 'overview') body = `{"reservations":${JSON.stringify(active())},${body.slice(1)}`;
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
