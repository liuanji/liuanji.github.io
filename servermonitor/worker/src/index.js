// Public JSON relay for the GPU dashboard, deployed on the Workers Free plan.
//
//   POST /upload        Authorization: Bearer <UPLOAD_TOKEN>
//                       body: {"files": {"<name>": "<JSON text>", ...}}
//   GET  /files/<name>  the stored JSON text, readable from ALLOWED_ORIGINS
//
// File contents arrive as JSON strings and are stored verbatim, so the Worker
// never parses or re-serializes them: the free plan allows 10 ms CPU per request.

const NAME_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const MAX_UPLOAD_CHARS = 1_000_000;
// D1 allows 50 queries per invocation on the free plan; each file is one query.
const MAX_FILES_PER_UPLOAD = 40;
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
      if (request.method === "GET" && url.pathname.startsWith("/files/")) {
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
      "Cache-Control": "public, max-age=15",
    },
  });
}

async function authorized(request, env) {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!env.UPLOAD_TOKEN || !token) {
    return false;
  }
  // Hash first so timingSafeEqual always compares equal-length buffers.
  const [given, expected] = await Promise.all([sha256(token), sha256(env.UPLOAD_TOKEN)]);
  return crypto.subtle.timingSafeEqual(given, expected);
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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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
