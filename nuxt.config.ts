// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxthub/core",
  ],
  devtools: {
    enabled: true,
  },
  hub: {
    db: "postgresql",
  },
  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
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
});
