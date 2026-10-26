# App Fix Tasks — For AI Agent

This file lists all issues found during the full app review (functionality, mobile/PC, bugs, PWA). Each task includes: location, problem, fix, and verification. Implement in order, running `bun run lint`, `bun run typecheck`, and `bun run test` after each task.

## Prerequisites

- Working directory: `/home/illufoxkusanagi/Documents/new-my-okane`
- Package manager: `bun`
- Verification commands: `bun run lint`, `bun run typecheck`, `bun run test`

---

## Task 1: PWA — Add Runtime Caching for API Endpoints (High)

**Location:** `nuxt.config.ts` — `pwa.workbox` section

**Problem:** The PWA has no `runtimeCaching` configuration. All `/api/` requests fail when the app is offline because there's no service worker strategy for API responses.

**Fix:** Add a `runtimeCaching` array to the `workbox` config in `nuxt.config.ts`:

```ts
workbox: {
  navigateFallback: '/',
  navigateFallbackDenylist: [/^\/api/, /^\/_nuxt/],
  runtimeCaching: [
    {
      urlPattern: /^\/api\//,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5 // 5 minutes
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ]
}
```

**Verification:** `bun run build` succeeds; no new lint/typecheck errors.

---

## Task 2: PWA — Add Offline Fallback Page (High)

**Location:** `nuxt.config.ts` + new file `public/offline.html`

**Problem:** When offline on an uncached route, there's no offline UI — users see a browser error page.

**Fix:**

1. Create `public/offline.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Offline — My Okane</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #1b1718; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #a8a29e; }
    button { margin-top: 1rem; padding: 0.6rem 1.2rem; background: #4ade80; color: #1b1718; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; }
    button:hover { background: #86efac; }
  </style>
</head>
<body>
  <h1>You're Offline</h1>
  <p>My Okane can't sync while you're offline. Your data is stored locally and will sync when you reconnect.</p>
  <button onclick="window.location.reload()">Try Again</button>
</body>
</html>
```

2. Add `offlineFallback` to the `workbox` config in `nuxt.config.ts`:

```ts
workbox: {
  navigateFallback: '/',
  navigateFallbackDenylist: [/^\/api/, /^\/_nuxt/],
  offlineFallback: 'offline.html',  // optional: depends on @vite-pwa/nuxt version support
  // ... runtimeCaching from Task 1
}
```

If `offlineFallback` isn't supported by the installed `@vite-pwa/nuxt` version, create a Nuxt plugin or middleware that catches network errors and shows an offline UI instead.

**Verification:** `bun run build` generates a service worker that caches API responses.

---

## Task 3: PWA — Enable PWA in Dev Mode (Medium)

**Location:** `nuxt.config.ts` — `pwa.devOptions`

**Problem:** `devOptions.enabled: false` means PWA features (service worker, manifest) are not active during `bun run dev`, so developers can't test PWA behavior locally.

**Fix:** Change `devOptions.enabled` to `true`:

```ts
devOptions: {
  enabled: true,
  type: 'module'
}
```

**Verification:** `bun run dev` registers the service worker (check Application tab in DevTools).

---

## Task 4: Mobile Detection — Replace `navigator.userAgent` (Medium)

**Location:** `app/pages/useTransactionsController.ts:24-26`

**Problem:** Mobile detection uses an unreliable `navigator.userAgent` regex (`/Mobi|Android|iPhone|iPad/`). Modern tablets and some phones may not match, causing the receipt scan camera capture setting to be wrong.

**Fix:** Replace:

```ts
const isMobile = ref(false)
onMounted(() => {
  isMobile.value = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
})
```

With:

```ts
const isMobile = ref(false)
onMounted(() => {
  isMobile.value = window.matchMedia('(pointer: coarse)').matches
    || window.innerWidth < 768
})
```

**Verification:** `bun run typecheck` passes; no runtime errors on mount.

---

## Task 5: Pagination Reset on Filter Change (Medium)

**Location:** `app/pages/useTransactionsFilter.ts` (and/or `app/pages/useTransactionsController.ts`)

**Problem:** When a user is on page 2+ of transactions, then applies a filter that results in fewer items than fit on one page, the page displays empty because `currentPage` isn't reset to 1.

**Fix:** In `useTransactionsFilter.ts`, add a watch that resets `currentPage` when any filter changes:

```ts
watch(
  [searchQuery, selectedType, selectedCategoryId],
  () => {
    currentPage.value = 1
  }
)
```

If `useTransactionsFilter.ts` doesn't expose these as writable refs, add the watch in `useTransactionsController.ts` where the filter state is consumed.

**Verification:** Navigate to page 2+, apply a filter with few results — page should show page 1 of results, not empty.

---

## Task 6: Weekly Budget Approximation (Low)

**Location:** `app/pages/index.vue:65-67`

**Problem:** `weeklyBudgetLimit` is computed as `Math.round(monthlyBudgetLimit.value / 4)`, which is an approximation (4 weeks ≠ 1 month exactly).

**Fix:** This is cosmetic. Either leave as-is, or improve with a comment noting the approximation. No code change strictly required.

---

## Task 7: Verify All Verification Gates Pass

After completing all tasks above:

```bash
bun run lint      # must be 0 errors
bun run typecheck # must be 0 errors
bun run test      # must be 100% passing
```

---

## Completed Items (Already Fixed — Do Not Re-implement)

The following were already remediated in previous sessions:

- **VULN-01:** Transaction/category type invariant bypass — `server/api/transactions/[id].put.ts` now pre-fetches existing transaction and validates effective type vs category.
- **VULN-02:** Sentry tunnel unbounded memory — `server/routes/tunnel.post.ts` now has 256KB body cap.
- **VULN-03:** Receipt scan secret fallback — `server/api/receipts/scan.post.ts` now uses `getEnv`/`process.env` fallback.
- **VULN-04:** Scrypt crypto-DoS — `server/utils/validator.ts` `passwordSchema` has `.max(128)`; login/register/change-password bounded.
- **VULN-05:** Budget on income category — `server/api/budgets/index.post.ts` requires `category.type === 'spending'`.
- **VULN-06:** Single-dimension IP rate limiting — `server/api/auth/login.post.ts` has per-account bucket; `server/utils/rateLimiter.ts` supports `customKey`.
- **Password reset defect** — missing `hashUserPassword` import fixed; rate limit inside try/catch; transaction + token re-check for single-use.

---

## Verification Commands

```bash
# Lint
bun run lint

# Typecheck
bun run typecheck

# Tests
bun run test

# Build (to verify PWA/service worker generation)
bun run build
```

All gates must pass before considering the tasks complete.
