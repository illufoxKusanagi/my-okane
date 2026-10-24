import { setWorkerEnv } from '~~/server/utils/runtimeEnv'

interface CloudflareContext {
  env?: Record<string, string | undefined>
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    const cf = event.context.cloudflare as CloudflareContext | undefined
    setWorkerEnv(cf?.env)
  })
})
