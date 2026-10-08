// Password-protected JSON relay for the GPU dashboard, deployed on the Workers
// Free plan.
//
//   POST /upload        Authorization: Bearer <UPLOAD_TOKEN>
//                       body: {"files": {"<name>": "<JSON text>", ...}}
//   POST /login         body: {"username": "<server account>", "password": "<LOGIN_PASSWORD>"}
//                       returns {"token": "<session>", "expires_at": <unix seconds>, "user": "<name>"}
//   GET  /files/<name>  Authorization: Bearer <session>
//                       the stored JSON text, readable from ALLOWED_ORIGINS; the
//                       overview also lists the current GPU reservations
//   POST /reservations  Authorization: Bearer <session>
//                       body: {"host": "<name>", "gpu": <index>, "minutes": <1-240>}
//                       reserves a free GPU
//   DELETE /reservations/<host>/<gpu>
//                       Authorization: Bearer <session>; releases your reservation
//   Both reservation calls return {"reservations": [...]}, the current list.
//
// A session is "<expiry>.<username>.<HMAC of both and LOGIN_PASSWORD>" keyed
// with SESSION_SECRET, so changing the password signs everyone out without any
// session storage. Only usernames in the roster, the servers' login accounts
// uploaded by the jump machine, may sign in; the roster itself is never served.
//
// File contents arrive as JSON strings and are stored verbatim, so the Worker
// never parses or re-serializes them: the free plan allows 10 ms CPU per request.

const NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const MAX_UPLOAD_CHARS = 1_000_000;
// D1 allows 50 queries per invocation on the free plan; each file is one query.
const MAX_FILES_PER_UPLOAD = 40;
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const USERNAME_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,31}$/;
const SESSION_PATTERN = /^(\d{1,12})\.([A-Za-z0-9_][A-Za-z0-9._-]{0,31})\.([A-Za-z0-9_-]{43})$/;
// Files only the Worker reads.
const PRIVATE_FILES = new Set(["roster"]);
// GPUs are reserved for debugging: at most this long, and this many per person.
const MAX_RESERVATION_MINUTES = 240;
const MAX_RESERVATIONS_PER_USER = 2;
// Reservation times all come from the database's clock (unixepoch(), fixed for
// the length of a statement), never a Worker's, so instances whose clocks
// differ cannot disagree about whether a reservation has ended.
const ACTIVE_RESERVATIONS = `
  SELECT host, gpu, user, starts_at, ends_at FROM reservations
  WHERE ends_at > unixepoch() ORDER BY host, gpu
`;
// Takes a free GPU (or one whose reservation has ended) unless the caller
// already holds the maximum. The check and the write are one statement, and
// D1 runs statements one at a time, so two people clicking at once cannot
// both win, nor can one person's simultaneous requests pass the limit. A
// reservation is never extended: its holder releases it and reserves again.
const RESERVE = `
  INSERT INTO reservations (host, gpu, user, starts_at, ends_at)
  SELECT ?1, ?2, ?3, unixepoch(), unixepoch() + ?4
  WHERE (SELECT COUNT(*) FROM reservations WHERE user = ?3 AND ends_at > unixepoch()) < ?5
  ON CONFLICT (host, gpu) DO UPDATE SET
    user = excluded.user, starts_at = excluded.starts_at, ends_at = excluded.ends_at
  WHERE reservations.ends_at <= excluded.starts_at
`;
const RELEASE = "DELETE FROM reservations WHERE host = ?1 AND gpu = ?2 AND user = ?3";
const UPSERT = `
  INSERT INTO files (name, body, updated_at) VALUES (?1, ?2, ?3)
  ON CONFLICT (name) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
      }
      if (request.method === "POST" && url.pathname === "/upload") {
        return await upload(request, env);
      }
      if (request.method === "POST" && url.pathname === "/login") {
        return await login(request, env, cors);
      }
      if (request.method === "GET" && url.pathname.startsWith("/files/")) {
        if (!(await sessionUser(bearer(request), env))) {
          return json({ error: "login required" }, 401, cors);
        }
        return await read(url.pathname.slice("/files/".length), env, cors);
      }
      if (url.pathname === "/reservations" || url.pathname.startsWith("/reservations/")) {
        const user = await sessionUser(bearer(request), env);
        if (!user) {
          return json({ error: "login required" }, 401, cors);
        }
        if (request.method === "POST" && url.pathname === "/reservations") {
          return await reserve(request, user, env, cors);
        }
        if (request.method === "DELETE") {
          return await release(url.pathname.slice("/reservations/".length), user, env, cors);
        }
      }
      return json({ error: "not found" }, 404, cors);
    } catch (error) {
      // Includes D1 refusing queries after the free daily limit is reached.
      console.error(error);
      return json({ error: "unavailable" }, 503, cors);
    }
  },
};

async function upload(request, env) {
  if (!(await authorized(request, env))) {
    return json({ error: "unauthorized" }, 401);
  }
  const text = await request.text();
  if (text.length > MAX_UPLOAD_CHARS) {
    return json({ error: `upload exceeds ${MAX_UPLOAD_CHARS} characters` }, 413);
  }
  let files;
  try {
    ({ files } = JSON.parse(text));
  } catch {
    return json({ error: "body must be a JSON object" }, 400);
  }
  if (typeof files !== "object" || files === null || Array.isArray(files)) {
    return json({ error: "files must be an object" }, 400);
  }
  const entries = Object.entries(files);
  if (entries.length === 0 || entries.length > MAX_FILES_PER_UPLOAD) {
    return json({ error: `upload between 1 and ${MAX_FILES_PER_UPLOAD} files` }, 400);
  }
  for (const [name, body] of entries) {
    if (!NAME_PATTERN.test(name)) {
      return json({ error: `invalid file name: ${name}` }, 400);
    }
    if (typeof body !== "string") {
      return json({ error: `${name} must be sent as a JSON string` }, 400);
    }
  }
  const now = Math.floor(Date.now() / 1000);
  const statement = env.DB.prepare(UPSERT);
  await env.DB.batch(entries.map(([name, body]) => statement.bind(name, body, now)));
  return json({ stored: entries.length });
}

async function read(name, env, cors) {
  let body = NAME_PATTERN.test(name) && !PRIVATE_FILES.has(name)
    ? await env.DB.prepare("SELECT body FROM files WHERE name = ?1").bind(name).first("body")
    : null;
  if (body === null) {
    return json({ error: "not found" }, 404, cors);
  }
  if (name === "overview" && body.startsWith("{") && body !== "{}") {
    // Spliced in as text, so the overview itself is never parsed.
    const reservations = await activeReservations(env);
    body = `{"reservations":${JSON.stringify(reservations)},${body.slice(1)}`;
  }
  return new Response(body, {
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, max-age=15",
    },
  });
}

async function login(request, env, cors) {
  if (!env.LOGIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: "login is not configured" }, 503, cors);
  }
  // Slows password guessing; the free plan allows the rate limiting binding.
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (env.LOGIN_LIMITER && !(await env.LOGIN_LIMITER.limit({ key: ip })).success) {
    return json({ error: "too many attempts" }, 429, cors);
  }
  let password, username;
  try {
    ({ password, username } = await request.json());
  } catch {
    return json({ error: "body must be a JSON object" }, 400, cors);
  }
  if (typeof password !== "string" || !(await secretEquals(password, env.LOGIN_PASSWORD))) {
    return json({ error: "wrong password" }, 401, cors);
  }
  const roster = await readRoster(env);
  if (!roster) {
    return json({ error: "the server accounts have not been uploaded yet" }, 503, cors);
  }
  // Accounts are matched ignoring case, then signed in under their exact name.
  const wanted = typeof username === "string" ? username.trim().toLowerCase() : "";
  const accounts = new Set(Object.values(roster.hosts ?? {}).flatMap((host) => host.users ?? []));
  const user = [...accounts].find((account) => account.toLowerCase() === wanted);
  if (!user || !USERNAME_PATTERN.test(user)) {
    return json({ error: "unknown user" }, 403, cors);
  }
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = `${expiresAt}.${user}.${base64url(await sessionSignature(expiresAt, user, env))}`;
  return json({ token, expires_at: expiresAt, user }, 200, cors);
}

// The signed-in username, or null for a missing, expired or forged session.
async function sessionUser(token, env) {
  if (!env.LOGIN_PASSWORD || !env.SESSION_SECRET) {
    return null;
  }
  const match = SESSION_PATTERN.exec(token);
  if (!match || Number(match[1]) <= Date.now() / 1000) {
    return null;
  }
  const expected = await sessionSignature(Number(match[1]), match[2], env);
  return crypto.subtle.timingSafeEqual(fromBase64url(match[3]), expected) ? match[2] : null;
}

async function readRoster(env) {
  const body = await env.DB.prepare("SELECT body FROM files WHERE name = 'roster'").first("body");
  try {
    return body ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

async function activeReservations(env) {
  const { results } = await env.DB.prepare(ACTIVE_RESERVATIONS).all();
  return results;
}

async function reserve(request, user, env, cors) {
  // Shares the login limiter, so a runaway page cannot burn through D1 writes.
  if (env.LOGIN_LIMITER && !(await env.LOGIN_LIMITER.limit({ key: `reserve:${user}` })).success) {
    return json({ error: "too many attempts" }, 429, cors);
  }
  let host, gpu, minutes;
  try {
    ({ host, gpu, minutes } = await request.json());
  } catch {
    return json({ error: "body must be a JSON object" }, 400, cors);
  }
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_RESERVATION_MINUTES) {
    return json({ error: `minutes must be 1 to ${MAX_RESERVATION_MINUTES}` }, 400, cors);
  }
  const roster = await readRoster(env);
  const server = typeof host === "string" ? roster?.hosts?.[host] : undefined;
  if (!server || !Number.isInteger(gpu) || !(server.gpus ?? []).includes(gpu)) {
    return json({ error: "no such GPU" }, 404, cors);
  }
  if (!(server.users ?? []).includes(user)) {
    return json({ error: "no account on this server" }, 403, cors);
  }
  // The write and the list run as one batch, so the list returned is exactly
  // the state this write left.
  const [written, listed] = await env.DB.batch([
    env.DB.prepare(RESERVE).bind(host, gpu, user, minutes * 60, MAX_RESERVATIONS_PER_USER),
    env.DB.prepare(ACTIVE_RESERVATIONS),
  ]);
  const reservations = listed.results;
  if (!written.meta.changes) {
    const holder = reservations.find((item) => item.host === host && item.gpu === gpu);
    // Asking again for a GPU you already hold (a retry, or a second tab) succeeds.
    if (holder?.user === user) {
      return json({ reservations }, 200, cors);
    }
    return holder
      ? json({ error: "already reserved", reservations }, 409, cors)
      : json({ error: "reservation limit reached", reservations }, 409, cors);
  }
  return json({ reservations }, 200, cors);
}

async function release(path, user, env, cors) {
  const match = /^([^/]{1,64})\/(\d{1,3})$/.exec(path);
  if (!match) {
    return json({ error: "not found" }, 404, cors);
  }
  const [, listed] = await env.DB.batch([
    env.DB.prepare(RELEASE).bind(match[1], Number(match[2]), user),
    env.DB.prepare(ACTIVE_RESERVATIONS),
  ]);
  return json({ reservations: listed.results }, 200, cors);
}

async function sessionSignature(expiresAt, user, env) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const message = new TextEncoder().encode(`${expiresAt}\n${user}\n${env.LOGIN_PASSWORD}`);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, message));
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(text) {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bearer(request) {
  const header = request.headers.get("Authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
}

async function authorized(request, env) {
  const token = bearer(request);
  return Boolean(env.UPLOAD_TOKEN && token) && (await secretEquals(token, env.UPLOAD_TOKEN));
}

async function secretEquals(given, expected) {
  // Hash first so timingSafeEqual always compares equal-length buffers.
  const [a, b] = await Promise.all([sha256(given), sha256(expected)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

function sha256(value) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((item) => item.trim());
  if (!origin || !allowed.includes(origin)) {
    return { Vary: "Origin" };
  }
  return {
    Vary: "Origin",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
