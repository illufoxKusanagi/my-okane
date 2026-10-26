import { fileURLToPath } from 'node:url'

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
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '192x192',
          href: '/pwa-192x192.png'
        },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || '',
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendFrom: process.env.RESEND_FROM || '',
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || '',
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    appUrl: process.env.NUXT_APP_URL || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || '',
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      }
    },
    public: {
      sentry: {
        dsn: process.env.NUXT_PUBLIC_SENTRY_DSN || ''
      }
    }
  },

  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy':
          'default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'wasm-unsafe-eval\'; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com; img-src \'self\' data: blob:; connect-src \'self\' https://generativelanguage.googleapis.com https://*.sentry.io https://*.ingest.sentry.io; object-src \'none\'; base-uri \'self\'; form-action \'self\';'
      }
    }
  },

  sourcemap: {
    client: 'hidden'
  },

  compatibilityDate: '2025-01-15',
  nitro: {
    preset: 'cloudflare-module',
    cloudflare: {
      wrangler: {
        compatibility_flags: [
          'nodejs_compat',
          'nodejs_compat_populate_process_env'
        ],
        keep_vars: true
      }
    },
    alias: {
      '@react-email/render': fileURLToPath(
        new URL('./server/stubs/react-email-render.ts', import.meta.url)
      )
    }
  },

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
              maxAgeSeconds: 60 * 5
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    devOptions: {
      enabled: true,
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
