// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxthub/core",
    "@sentry/nuxt/module",
    "nuxt-auth-utils",
    "@vite-pwa/nuxt"
  ],
  app: {
    head: {
      link: [
        { rel: "icon", type: "image/png", href: "/pwa-192x192.png" },
        { rel: "apple-touch-icon", href: "/pwa-192x192.png" }
      ]
    }
  },

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "My Okane",
      short_name: "MyOkane",
      description: "Isolated Multi-User Personal Finance Tracker",
      theme_color: "#0f172a",
      background_color: "#0f172a",
      start_url: "/",
      display: "standalone",
      orientation: "portrait",
      icons: [
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    },
    workbox: {
      navigateFallback: "/"
    },
    devOptions: {
      enabled: true,
      type: "module"
    }
  },

  devtools: {
    enabled: true,
  },

  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || ""
    },
    public: {
      sentry: {
        dsn: process.env.NUXT_PUBLIC_SENTRY_DSN || ""
      }
    }
  },

  css: ["~/assets/css/main.css"],

  routeRules: {
    "/": { prerender: true },
  },

  compatibilityDate: "2025-01-15",

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },

  sentry: {
    org: "arief-satria",
    project: "my-okane",
    autoInjectServerSentry: "top-level-import",
    authToken: process.env.SENTRY_AUTH_TOKEN
  },

  sourcemap: {
    client: "hidden",
  },

  vite: {
    optimizeDeps: {
      include: [
        "@vue/devtools-core",
        "@vue/devtools-kit"
      ]
    }
  }
});