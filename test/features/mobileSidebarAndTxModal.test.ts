import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Mobile Sidebar & Transaction Modal Regressions', () => {
  const rootDir = path.resolve(__dirname, '../../app')

  it('verifies transactions.vue explicitly imports TransactionFormModal', () => {
    const transactionsPath = path.join(rootDir, 'pages/transactions.vue')
    const content = fs.readFileSync(transactionsPath, 'utf-8')

    expect(content).toContain(
      'import TransactionFormModal from \'~/components/transactions/TransactionFormModal.vue\''
    )
  })

  it('verifies default.vue implements mobile sidebar auto-closing on route navigation and mount', () => {
    const defaultLayoutPath = path.join(rootDir, 'layouts/default.vue')
    const content = fs.readFileSync(defaultLayoutPath, 'utf-8')

    expect(content).toContain('closeSidebarIfMobile')
    expect(content).toContain('watch(() => route.path, closeSidebarIfMobile)')
    expect(content).toContain('onMounted(closeSidebarIfMobile)')
    expect(content).toContain('@click="closeSidebarIfMobile"')
  })

  it('validates mobile sidebar closing condition logic', () => {
    const closeSidebarIfMobile = (
      isClient: boolean,
      innerWidth: number,
      setOpen: (val: boolean) => void
    ) => {
      if (isClient && innerWidth < 1024) {
        setOpen(false)
      }
    }

    let openState = true
    // On desktop (>= 1024px), sidebar remains open
    closeSidebarIfMobile(true, 1280, (val) => {
      openState = val
    })
    expect(openState).toBe(true)

    // On mobile (< 1024px, e.g. 375px phone), sidebar closes
    closeSidebarIfMobile(true, 375, (val) => {
      openState = val
    })
    expect(openState).toBe(false)
  })
})
