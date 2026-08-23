// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { ref, computed, watch, nextTick } from 'vue'

describe('Transactions Pagination & Filter Logic', () => {
  it('should slice transactions into paginated chunks correctly', () => {
    const rawList = Array.from({ length: 42 }, (_, i) => ({
      id: i + 1,
      name: `Transaction ${i + 1}`,
      type: (i % 2 === 0 ? 'spending' : 'income') as 'spending' | 'income',
      amount: (i + 1) * 10000,
      categoryId: (i % 3) + 1
    }))

    const transactions = ref(rawList)
    const searchQuery = ref('')
    const selectedType = ref<'all' | 'income' | 'spending'>('all')
    const selectedCategoryId = ref<number | 'all'>('all')
    const currentPage = ref(1)
    const pageSize = ref(15)

    const filteredTransactions = computed(() => {
      return transactions.value.filter((t) => {
        const matchesSearch = t.name
          .toLowerCase()
          .includes(searchQuery.value.toLowerCase())
        const matchesType
          = selectedType.value === 'all' || t.type === selectedType.value
        const matchesCategory
          = selectedCategoryId.value === 'all'
            || t.categoryId === selectedCategoryId.value
        return matchesSearch && matchesType && matchesCategory
      })
    })

    const paginatedTransactions = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      return filteredTransactions.value.slice(start, start + pageSize.value)
    })

    // Page 1: items 1..15
    expect(filteredTransactions.value.length).toBe(42)
    expect(paginatedTransactions.value.length).toBe(15)
    expect(paginatedTransactions.value[0]?.name).toBe('Transaction 1')
    expect(paginatedTransactions.value[14]?.name).toBe('Transaction 15')

    // Page 2: items 16..30
    currentPage.value = 2
    expect(paginatedTransactions.value.length).toBe(15)
    expect(paginatedTransactions.value[0]?.name).toBe('Transaction 16')
    expect(paginatedTransactions.value[14]?.name).toBe('Transaction 30')

    // Page 3: items 31..42 (remainder 12)
    currentPage.value = 3
    expect(paginatedTransactions.value.length).toBe(12)
    expect(paginatedTransactions.value[0]?.name).toBe('Transaction 31')
    expect(paginatedTransactions.value[11]?.name).toBe('Transaction 42')
  })

  it('should auto-reset to page 1 whenever filters change', async () => {
    const searchQuery = ref('')
    const selectedType = ref<'all' | 'income' | 'spending'>('all')
    const selectedCategoryId = ref<number | 'all'>('all')
    const currentPage = ref(3)

    watch([searchQuery, selectedType, selectedCategoryId], () => {
      currentPage.value = 1
    })

    expect(currentPage.value).toBe(3)

    // Type filter change
    selectedType.value = 'income'
    await nextTick()
    expect(currentPage.value).toBe(1)

    // Move to page 2 then search
    currentPage.value = 2
    searchQuery.value = 'Transaction 5'
    await nextTick()
    expect(currentPage.value).toBe(1)
  })

  it('should detect active filters and reset cleanly', () => {
    const searchQuery = ref('coffee')
    const selectedType = ref<'all' | 'income' | 'spending'>('spending')
    const selectedCategoryId = ref<number | 'all'>(2)
    const currentPage = ref(2)

    const hasActiveFilters = computed(() => {
      return (
        searchQuery.value.trim() !== ''
        || selectedType.value !== 'all'
        || selectedCategoryId.value !== 'all'
      )
    })

    const resetFilters = () => {
      searchQuery.value = ''
      selectedType.value = 'all'
      selectedCategoryId.value = 'all'
      currentPage.value = 1
    }

    expect(hasActiveFilters.value).toBe(true)

    resetFilters()

    expect(searchQuery.value).toBe('')
    expect(selectedType.value).toBe('all')
    expect(selectedCategoryId.value).toBe('all')
    expect(currentPage.value).toBe(1)
    expect(hasActiveFilters.value).toBe(false)
  })
})
