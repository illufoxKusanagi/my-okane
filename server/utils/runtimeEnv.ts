type Env = Record<string, string | undefined>

let workerEnv: Env = {}

export function setWorkerEnv(env: Env | undefined): void {
  if (env) workerEnv = env
}

/** Worker binding first (Cloudflare), then process.env (dev/tests/Node). */
export function getEnv(key: string): string | undefined {
  return workerEnv[key] ?? process.env[key]
}
