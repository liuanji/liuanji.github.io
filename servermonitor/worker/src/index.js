// Password-protected JSON relay for the GPU dashboard, deployed on the Workers
// Free plan.
//
//   POST /upload        Authorization: Bearer <UPLOAD_TOKEN>
//                       body: {"files": {"<name>": "<JSON text>", ...}}
//   POST /login         body: {"password": "<LOGIN_PASSWORD>"}
//                       returns {"token": "<session>", "expires_at": <unix seconds>}
//   GET  /files/<name>  Authorization: Bearer <session>
//                       the stored JSON text, readable from ALLOWED_ORIGINS
//
// A session is "<expiry>.<HMAC of the expiry and LOGIN_PASSWORD>" keyed with
// SESSION_SECRET, so changing the password signs everyone out without any
// session storage.
//
// File contents arrive as JSON strings and are stored verbatim, so the Worker
// never parses or re-serializes them: the free plan allows 10 ms CPU per request.

const NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const MAX_UPLOAD_CHARS = 1_000_000;
// D1 allows 50 queries per invocation on the free plan; each file is one query.
const MAX_FILES_PER_UPLOAD = 40;
const SESSION_SECONDS = 30 * 24 * 60 * 60;
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
        if (!(await validSession(bearer(request), env))) {
          return json({ error: "login required" }, 401, cors);
        }
        return await read(url.pathname.slice("/files/".length), env, cors);
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
  const body = NAME_PATTERN.test(name)
    ? await env.DB.prepare("SELECT body FROM files WHERE name = ?1").bind(name).first("body")
    : null;
  if (body === null) {
    return json({ error: "not found" }, 404, cors);
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
  let password;
  try {
    ({ password } = await request.json());
  } catch {
    return json({ error: "body must be a JSON object" }, 400, cors);
  }
  if (typeof password !== "string" || !(await secretEquals(password, env.LOGIN_PASSWORD))) {
    return json({ error: "wrong password" }, 401, cors);
  }
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = `${expiresAt}.${base64url(await sessionSignature(expiresAt, env))}`;
  return json({ token, expires_at: expiresAt }, 200, cors);
}

async function validSession(token, env) {
  if (!env.LOGIN_PASSWORD || !env.SESSION_SECRET) {
    return false;
  }
  const match = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match || Number(match[1]) <= Date.now() / 1000) {
    return false;
  }
  const expected = await sessionSignature(Number(match[1]), env);
  return crypto.subtle.timingSafeEqual(fromBase64url(match[2]), expected);
}

async function sessionSignature(expiresAt, env) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const message = new TextEncoder().encode(`${expiresAt}\n${env.LOGIN_PASSWORD}`);
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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
