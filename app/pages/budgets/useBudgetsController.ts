import { ref, computed } from 'vue'

export function useBudgetsController() {
  const currentMonth = ref(new Date().toISOString().slice(0, 7))

  const { data: budgetData, status, refresh } = useFetch('/api/budgets', {
    query: { month: currentMonth }
  })

  const pending = computed(() => status.value === 'pending')

  const { addCategory } = useFinance()

  const isModalOpen = ref(false)
  const selectedCategoryId = ref<number | null>(null)
  const budgetAmount = ref<number | null>(null)

  const isCreatePocketModalOpen = ref(false)
  const pocketName = ref('')
  const pocketType = ref<'spending' | 'income'>('spending')
  const pocketColor = ref('blue')
  const pocketIcon = ref('i-lucide-folder')
  const pocketBudgetLimit = ref<number | null>(null)

  const openCreatePocketModal = () => {
    pocketName.value = ''
    pocketType.value = 'spending'
    pocketColor.value = 'blue'
    pocketIcon.value = 'i-lucide-folder'
    pocketBudgetLimit.value = null
    isCreatePocketModalOpen.value = true
  }

  const toast = useToast()

  const handleCreatePocket = async () => {
    if (!pocketName.value.trim()) return

    try {
      const newCategory = await addCategory(
        pocketName.value,
        pocketType.value,
        pocketIcon.value,
        pocketColor.value
      )

      if (
        newCategory
        && pocketType.value === 'spending'
        && pocketBudgetLimit.value !== null
        && pocketBudgetLimit.value > 0
      ) {
        await $fetch('/api/budgets', {
          method: 'POST',
          body: {
            categoryId: newCategory.id,
            amount: pocketBudgetLimit.value,
            month: currentMonth.value
          }
        })
      }

      isCreatePocketModalOpen.value = false
      refresh()
    } catch (error) {
      console.error('Failed to create pocket:', error)
      toast.add({
        title: 'Failed to Create Pocket',
        description: describeApiError(error),
        color: 'error'
      })
    }
  }

  const prevMonth = () => {
    const parts = currentMonth.value.split('-').map(Number)
    const year = parts[0] ?? new Date().getFullYear()
    const month = parts[1] ?? new Date().getMonth() + 1
    const date = new Date(Date.UTC(year, month - 2, 1))
    currentMonth.value = date.toISOString().slice(0, 7)
  }

  const nextMonth = () => {
    const parts = currentMonth.value.split('-').map(Number)
    const year = parts[0] ?? new Date().getFullYear()
    const month = parts[1] ?? new Date().getMonth() + 1
    const date = new Date(Date.UTC(year, month, 1))
    currentMonth.value = date.toISOString().slice(0, 7)
  }

  const openBudgetModal = (categoryId: number | null, currentAmount = 0) => {
    selectedCategoryId.value = categoryId
    budgetAmount.value = currentAmount || null
    isModalOpen.value = true
  }

  const handleSaveBudget = async () => {
    try {
      await $fetch('/api/budgets', {
        method: 'POST',
        body: {
          categoryId: selectedCategoryId.value,
          amount: budgetAmount.value || 0,
          month: currentMonth.value
        }
      })
      isModalOpen.value = false
      refresh()
    } catch (error) {
      console.error('Failed to save budget:', error)
    }
  }

  return {
    currentMonth,
    budgetData,
    status,
    pending,
    isModalOpen,
    selectedCategoryId,
    budgetAmount,
    isCreatePocketModalOpen,
    pocketName,
    pocketType,
    pocketColor,
    pocketIcon,
    pocketBudgetLimit,
    openCreatePocketModal,
    handleCreatePocket,
    prevMonth,
    nextMonth,
    openBudgetModal,
    handleSaveBudget
  }
}
