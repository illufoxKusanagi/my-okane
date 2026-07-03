# Sentry Setup & Alerts Implementation — `my-okane`

## Project Info

| Field        | Value                          |
|--------------|--------------------------------|
| Platform     | Nuxt (javascript-nuxt)         |
| Sentry Org   | `arief-satria`                 |
| Sentry Project | `my-okane`                   |

---

## 1. Environment Variables

Add the following to your `.env` file:

```env
# Required: Sentry DSN for the my-okane project
NUXT_PUBLIC_SENTRY_DSN=https://c5066d8aee46ddbd3aef9d401a40f238@o4511063272390656.ingest.us.sentry.io/4511668334821376

# Required for source map uploads at build time
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>

# Optional: used in tunnel route to specify Sentry ingest host
SENTRY_HOST=o4511063272390656.ingest.us.sentry.io
```

> Get `SENTRY_AUTH_TOKEN` from: **Sentry → Settings → Auth Tokens → Create New Token** (scope: `project:releases`, `org:read`).

---

## 2. Install the SDK

```bash
npm install @sentry/nuxt --save
```

---

## 3. Configure `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ["@sentry/nuxt/module"],

  runtimeConfig: {
    public: {
      sentry: {
        dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
      },
    },
  },

  sentry: {
    org: "arief-satria",
    project: "my-okane",
    authToken: process.env.SENTRY_AUTH_TOKEN,
  },

  sourcemap: { client: "hidden" },
});
```

---

## 4. Client-Side Sentry (`sentry.client.config.ts`)

Create at the project root:

```ts
import * as Sentry from "@sentry/nuxt";

Sentry.init({
  dsn: useRuntimeConfig().public.sentry.dsn,

  // Route events through your own tunnel to bypass ad-blockers
  tunnel: "/tunnel",

  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],
});
```

---

## 5. Server-Side Sentry (`sentry.server.config.ts`)

Create at the project root:

```ts
import * as Sentry from "@sentry/nuxt";

Sentry.init({
  dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

---

## 6. Tunnel Route (`server/routes/tunnel.post.ts`)

This proxies Sentry events from the browser through your server, bypassing ad-blockers.

```ts
import { defineEventHandler, readRawBody } from "h3";

const SENTRY_HOST = process.env.SENTRY_HOST ?? "o4511063272390656.ingest.us.sentry.io";
const KNOWN_PROJECT_IDS = ["4511668334821376"];

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event);
  if (!body) {
    return new Response("No body", { status: 400 });
  }

  try {
    const lines = body.split("\n");
    const header = JSON.parse(lines[0]);
    const dsn = new URL(header.dsn);
    const projectId = dsn.pathname.replace("/", "");

    if (!KNOWN_PROJECT_IDS.includes(projectId)) {
      return new Response("Invalid project ID", { status: 403 });
    }

    if (dsn.hostname !== SENTRY_HOST) {
      return new Response("Invalid Sentry host", { status: 403 });
    }

    const upstreamUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`;
    const response = await fetch(upstreamUrl, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-sentry-envelope" },
    });

    return new Response(null, { status: response.status });
  } catch (err) {
    console.error("[sentry-tunnel] Error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
```

---

## 7. Build & Run

Sentry server-side monitoring **does not work in dev mode**. You must build first:

```bash
# Build the project
npx nuxi build

# Run with Sentry server config loaded
node --import ./.output/server/sentry.server.config.mjs .output/server/index.mjs
```

Or with env file:

```bash
node --env-file=.env --import ./.output/server/sentry.server.config.mjs .output/server/index.mjs
```

---

## 8. Set Up Alerts in Sentry UI

Navigate to **Alerts → Create Alert Rule** in your Sentry project.

### Recommended: Issue Alert (errors as they happen)

| Setting         | Value                              |
|-----------------|------------------------------------|
| Alert type      | Issues                             |
| Project         | `my-okane`                         |
| Environment     | `production`                       |
| Trigger         | A new issue is created             |
| Action          | Send notification to email / Slack |

### Recommended: Metric Alert (error volume spike)

| Setting         | Value                              |
|-----------------|------------------------------------|
| Alert type      | Number of Errors                   |
| Project         | `my-okane`                         |
| Threshold type  | Static                             |
| Critical        | > 50 errors in 5 minutes           |
| Action          | Send notification to email / Slack |

> For Slack integration, first connect it under **Settings → Integrations → Slack**.

---

## 9. Verify Setup

1. Add a test button that throws an error and confirm it appears under **Issues** in Sentry.
2. Check **Traces** to confirm spans are being captured.
3. Confirm `/tunnel` requests appear in your server logs (not going directly to `ingest.sentry.io`).