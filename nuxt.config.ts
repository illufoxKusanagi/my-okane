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
  ],

  devtools: {
    enabled: true,
  },

  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
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