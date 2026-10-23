import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import authMiddleware from '~~/app/middleware/auth.global'

const { mockLoggedIn, mockNavigateTo } = vi.hoisted(() => ({
  mockLoggedIn: { value: false },
  mockNavigateTo: vi.fn((to: string) => ({ redirectedTo: to }))
}))

vi.mock('#app/composables/router', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>()
  return {
    ...original,
    defineNuxtRouteMiddleware: (fn: unknown) => fn,
    navigateTo: (to: string) => mockNavigateTo(to)
  }
})

vi.mock('../../node_modules/nuxt-auth-utils/dist/runtime/app/composables/session', () => ({
  useUserSession: () => ({ loggedIn: mockLoggedIn })
}))

describe('auth.global route middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoggedIn.value = false
  })

  describe('Unauthenticated visitor (loggedIn = false)', () => {
    it.each([
      ['/login'],
      ['/register'],
      ['/forgot-password'],
      ['/reset-password']
    ])('allows guest access to public route "%s" without redirecting', (path) => {
      const to = { path } as RouteLocationNormalized
      const result = authMiddleware(to, {} as RouteLocationNormalized)

      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it.each([
      ['/'],
      ['/transactions'],
      ['/categories'],
      ['/budgets']
    ])('redirects guest to "/login" when accessing protected route "%s"', (path) => {
      const to = { path } as RouteLocationNormalized
      const result = authMiddleware(to, {} as RouteLocationNormalized)

      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
      expect(result).toEqual({ redirectedTo: '/login' })
    })
  })

  describe('Authenticated user (loggedIn = true)', () => {
    beforeEach(() => {
      mockLoggedIn.value = true
    })

    it.each([
      ['/login'],
      ['/register'],
      ['/forgot-password'],
      ['/reset-password']
    ])('redirects authenticated user to "/" when visiting public route "%s"', (path) => {
      const to = { path } as RouteLocationNormalized
      const result = authMiddleware(to, {} as RouteLocationNormalized)

      expect(mockNavigateTo).toHaveBeenCalledWith('/')
      expect(result).toEqual({ redirectedTo: '/' })
    })

    it.each([
      ['/'],
      ['/transactions'],
      ['/categories'],
      ['/budgets']
    ])('allows access to protected route "%s" without redirecting', (path) => {
      const to = { path } as RouteLocationNormalized
      const result = authMiddleware(to, {} as RouteLocationNormalized)

      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })
})
