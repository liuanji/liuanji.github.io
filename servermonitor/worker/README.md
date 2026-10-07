# gpu-status Worker

A Cloudflare Worker + D1 database that relays the GPU dashboard's JSON from the
jump machine to the public website. It runs on the **Workers Free plan**: when a
daily free limit is reached, requests fail until 00:00 UTC (08:00 Singapore)
instead of being billed.

| Endpoint | Who | What |
| --- | --- | --- |
| `POST /upload` | jump machine, `Authorization: Bearer <UPLOAD_TOKEN>` | body `{"files": {"<name>": "<JSON text>", ...}}`, 1–40 files, ≤ 1 MB |
| `POST /login` | anyone, 10 attempts per IP per minute | body `{"password": "<LOGIN_PASSWORD>"}`; returns `{"token", "expires_at"}`, a session valid 30 days |
| `GET /files/<name>` | `Authorization: Bearer <session>`; CORS only for `ALLOWED_ORIGINS` | the stored JSON text |

A session is its expiry plus an HMAC of the expiry and `LOGIN_PASSWORD`, keyed
with `SESSION_SECRET`; nothing is stored. Changing either secret signs everyone
out.

File contents are sent as JSON *strings* so the Worker stores them without
parsing (the free plan allows 10 ms CPU per request).

## Setup

Run steps 1–5 on your laptop (needs Node 22+ and a browser for the login).
The jump machine only needs `curl`, `openssl` and Python.

**1. Cloudflare account.** Sign up at dash.cloudflare.com. Do not add a payment
method and do not upgrade to Workers Paid — that is what guarantees $0.

**2. Install and log in**

```bash
cd servermonitor/worker
npm install
npx wrangler login
```

**3. Create the database**

```bash
npx wrangler d1 create gpu-status --location apac
```

Paste the printed `database_id` into `wrangler.jsonc` in place of the zeros. If
wrangler offers to add the binding to the config, answer no — it already exists.

**4. Create the table**

```bash
npm run db:init
```

**5. Deploy**

```bash
npm run deploy
```

The first deploy asks you to choose a `workers.dev` subdomain for the account.
The Worker is then at `https://gpu-status.<subdomain>.workers.dev`. Uploads are
rejected until step 6 sets a token.

**6. Upload token.** Generate it on the jump machine:

```bash
mkdir -p ~/.config/servermonitor
(umask 077; openssl rand -hex 32 > ~/.config/servermonitor/upload_token)
```

Then store it in the Worker from your laptop, without keeping a local copy:

```bash
ssh <jump-machine> cat .config/servermonitor/upload_token | npx wrangler secret put UPLOAD_TOKEN
```

Repeat both commands to rotate the token.

**7. Login.** Choose the shared password /top asks for (prefer a long
passphrase: the rate limit slows guessing but cannot stop it), and a random
signing secret:

```bash
npx wrangler secret put LOGIN_PASSWORD
openssl rand -hex 32 | npx wrangler secret put SESSION_SECRET
```

Until both are set, `/login` answers 503 and `/files/*` answers 401. To change
the password, run the first command again; existing sessions stop working.

## Test

On the jump machine (this also confirms the campus network allows it):

```bash
curl -sS -X POST https://gpu-status.<subdomain>.workers.dev/upload \
  -H "Authorization: Bearer $(cat ~/.config/servermonitor/upload_token)" \
  --data '{"files":{"test":"{\"hello\":\"world\"}"}}'
```

Expect `{"stored":1}`. Then on your laptop, sign in and read it back:

```bash
read -rs -p "Password: " password; echo
token=$(curl -sS -X POST https://gpu-status.<subdomain>.workers.dev/login \
  --data "$(jq -n --arg p "$password" '{password: $p}')" | jq -r .token)
curl -i -H "Origin: https://liuanji.github.io" -H "Authorization: Bearer $token" \
  https://gpu-status.<subdomain>.workers.dev/files/test
```

Expect `200`, `access-control-allow-origin: https://liuanji.github.io` and
`{"hello":"world"}`; without the `Authorization` header, `401`. Remove the test
row with:

```bash
npx wrangler d1 execute gpu-status --remote --command "DELETE FROM files WHERE name = 'test'"
```

## Staying at $0

- Manage Account → Billing should show no payment method.
- Usage: Workers & Pages → gpu-status → Metrics, and D1 → gpu-status → Metrics.
- Free daily limits: 100,000 Worker requests, 100,000 D1 rows written,
  5,000,000 D1 rows read.

## Local development

```bash
printf 'UPLOAD_TOKEN=dev-token\nLOGIN_PASSWORD=dev-password\nSESSION_SECRET=dev-secret\n' > .dev.vars
npm run db:init:local
npm run dev
```
