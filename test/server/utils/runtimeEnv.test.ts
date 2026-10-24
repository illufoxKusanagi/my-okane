// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getEnv, setWorkerEnv } from '~~/server/utils/runtimeEnv'

describe('runtimeEnv', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    setWorkerEnv({})
  })

  afterEach(() => {
    setWorkerEnv({})
    process.env = { ...originalEnv }
  })

  it('binding wins over process.env', () => {
    process.env.TEST_KEY = 'node-value'
    setWorkerEnv({ TEST_KEY: 'worker-value' })
    expect(getEnv('TEST_KEY')).toBe('worker-value')
  })

  it('falls back to process.env when binding missing', () => {
    process.env.TEST_KEY = 'node-value'
    setWorkerEnv({ OTHER_KEY: 'worker-value' })
    expect(getEnv('TEST_KEY')).toBe('node-value')
  })

  it('returns undefined when neither binding nor process.env has the key', () => {
    delete process.env.TEST_KEY
    setWorkerEnv({})
    expect(getEnv('TEST_KEY')).toBeUndefined()
  })

  it('setWorkerEnv(undefined) does not wipe a previously set env', () => {
    setWorkerEnv({ PRESERVED_KEY: 'preserved-value' })
    setWorkerEnv(undefined)
    expect(getEnv('PRESERVED_KEY')).toBe('preserved-value')
  })
})
