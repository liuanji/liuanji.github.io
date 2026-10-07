# gpu-status Worker

A Cloudflare Worker + D1 database that relays the GPU dashboard's JSON from the
jump machine to the public website. It runs on the **Workers Free plan**: when a
daily free limit is reached, requests fail until 00:00 UTC (08:00 Singapore)
instead of being billed.

| Endpoint | Who | What |
| --- | --- | --- |
| `POST /upload` | jump machine, `Authorization: Bearer <UPLOAD_TOKEN>` | body `{"files": {"<name>": "<JSON text>", ...}}`, 1–40 files, ≤ 1 MB |
| `GET /files/<name>` | anyone; CORS only for `ALLOWED_ORIGINS` | the stored JSON text |

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

## Test

On the jump machine (this also confirms the campus network allows it):

```bash
curl -sS -X POST https://gpu-status.<subdomain>.workers.dev/upload \
  -H "Authorization: Bearer $(cat ~/.config/servermonitor/upload_token)" \
  --data '{"files":{"test":"{\"hello\":\"world\"}"}}'
```

Expect `{"stored":1}`. Then on your laptop:

```bash
curl -i -H "Origin: https://liuanji.github.io" https://gpu-status.<subdomain>.workers.dev/files/test
```

Expect `200`, `access-control-allow-origin: https://liuanji.github.io` and
`{"hello":"world"}`. Remove the test row with:

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
printf 'UPLOAD_TOKEN=dev-token\n' > .dev.vars
npm run db:init:local
npm run dev
```
