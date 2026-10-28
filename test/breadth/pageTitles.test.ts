import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Page Title Declarations Breadth Checks', () => {
  const rootDir = path.resolve(__dirname, '../../app')

  const expectedPageTitles: Record<string, string | RegExp> = {
    'pages/index.vue': /useSeoMeta\(\s*\{\s*title:\s*(\(\)\s*=>\s*t\('dashboard\.title'\)|'Dashboard')/,
    'pages/categories.vue': /useSeoMeta\(\s*\{\s*title:\s*(\(\)\s*=>\s*t\('categories\.title'\)|'Categories')/,
    'pages/transactions.vue': /useSeoMeta\(\s*\{\s*title:\s*(\(\)\s*=>\s*t\('transactions\.title'\)|'Transactions')/,
    'pages/budgets/index.vue': /useSeoMeta\(\s*\{\s*title:\s*(\(\)\s*=>\s*t\('budgets\.title'\)|'Budgets')/,
    'pages/budgets/[id].vue': /useSeoMeta\(\s*\{\s*title:\s*\(\)\s*=>/,
    'pages/login.vue': /useSeoMeta\(\s*\{\s*title:\s*(\(\)\s*=>\s*t\('auth\.signInTitle'\)|'Sign In')/,
    'pages/register.vue': /useSeoMeta\(\s*\{\s*title:\s*(\(\)\s*=>\s*t\('auth\.signUpTitle'\)|'Sign Up')/,
    'pages/forgot-password.vue': /useSeoMeta\(\s*\{\s*title:\s*(\(\)\s*=>\s*t\('auth\.forgotPasswordTitle'\)|'Forgot Password')/,
    'pages/reset-password.vue': /useSeoMeta\(\s*\{\s*title:\s*(\(\)\s*=>\s*t\('auth\.resetPasswordTitle'\)|'Reset Password')/,
    'error.vue': /useSeoMeta\(\s*\{\s*title:\s*\(\)\s*=>/
  }

  for (const [filePath, pattern] of Object.entries(expectedPageTitles)) {
    it(`should declare a title in '${filePath}'`, () => {
      const fullPath = path.join(rootDir, filePath)
      expect(fs.existsSync(fullPath)).toBe(true)
      const content = fs.readFileSync(fullPath, 'utf-8')
      expect(content).toMatch(pattern)
    })
  }
})
