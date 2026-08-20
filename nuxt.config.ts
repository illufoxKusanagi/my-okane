// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxthub/core',
    '@sentry/nuxt/module',
    'nuxt-auth-utils',
    '@vite-pwa/nuxt'
  ],

  devtools: {
    enabled: true
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/pwa-192x192.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || ''
    },
    public: {
      sentry: {
        dsn: process.env.NUXT_PUBLIC_SENTRY_DSN || ''
      }
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  sourcemap: {
    client: 'hidden'
  },

  compatibilityDate: '2025-01-15',

  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core', '@vue/devtools-kit']
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'My Okane',
      short_name: 'MyOkane',
      description: 'Isolated Multi-User Personal Finance Tracker',
      theme_color: '#1b1718',
      background_color: '#1b1718',
      start_url: '/',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api/, /^\/_nuxt/]
    },
    devOptions: {
      enabled: false,
      type: 'module'
    }
  },

  sentry: {
    org: 'arief-satria',
    project: 'my-okane',
    autoInjectServerSentry: 'top-level-import',
    authToken: process.env.SENTRY_AUTH_TOKEN
  }
})
