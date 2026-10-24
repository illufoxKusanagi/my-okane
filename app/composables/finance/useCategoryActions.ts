import * as Sentry from '@sentry/nuxt'
import type { Category } from './types'
import { useFinanceState } from './useFinanceState'

export function useCategoryActions() {
  const { transactions, categories } = useFinanceState()
  const toast = useToast()

  const addCategory = async (
    name: string,
    type: 'income' | 'spending',
    icon?: string,
    color?: string
  ) => {
    try {
      const res = await $fetch<{ success: boolean, data: Category }>(
        '/api/categories',
        {
          method: 'POST',
          body: { name, type, icon, color }
        }
      )
      if (res.success && res.data) {
        categories.value = [...categories.value, res.data]
        toast.add({
          title: 'Category Added',
          description: `Successfully added "${name}".`,
          color: 'success'
        })
        return res.data
      }
    } catch (error) {
      console.error('Failed to add category:', error)
      Sentry.captureException(error)
      toast.add({
        title: 'Failed to Add Category',
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    const previousCategories = [...categories.value]
    const previousTransactions = [...transactions.value]

    // Optimistically remove category and cascade-remove its transactions locally
    categories.value = categories.value.filter(c => c.id !== id)
    transactions.value = transactions.value.filter(t => t.categoryId !== id)

    try {
      const res = await $fetch<{ success: boolean }>(`/api/categories/${id}`, {
        method: 'DELETE'
      })
      if (res.success) {
        toast.add({
          title: 'Category Deleted',
          description: 'Category has been deleted successfully.',
          color: 'success'
        })
      }
    } catch (error) {
      // Rollback on failure
      categories.value = previousCategories
      transactions.value = previousTransactions
      console.error('Failed to delete category:', error)
      Sentry.captureException(error)
      toast.add({
        title: 'Failed to Delete Category',
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    }
  }

  const updateCategory = async (
    id: string,
    name: string,
    type: 'income' | 'spending',
    icon?: string,
    color?: string
  ) => {
    try {
      const res = await $fetch<{ success: boolean, data: Category }>(
        `/api/categories/${id}`,
        {
          method: 'PUT',
          body: { name, type, icon, color }
        }
      )
      if (res.success && res.data) {
        const updatedCat = res.data
        categories.value = categories.value.map(c =>
          c.id === id ? updatedCat : c
        )
        transactions.value = transactions.value.map((t) => {
          if (t.categoryId === id) {
            return {
              ...t,
              categoryName: updatedCat.name,
              categoryIcon: updatedCat.icon || undefined,
              categoryColor: updatedCat.color || undefined
            }
          }
          return t
        })
        toast.add({
          title: 'Category Updated',
          description: `Successfully updated "${name}".`,
          color: 'success'
        })
      }
    } catch (error) {
      console.error('Failed to update category:', error)
      Sentry.captureException(error)
      toast.add({
        title: 'Failed to Update Category',
        description: describeApiError(error),
        color: 'error'
      })
      throw error
    }
  }

  const getCategories = (type?: 'income' | 'spending') => {
    if (type === 'income')
      return categories.value.filter(c => c.type === 'income')
    if (type === 'spending')
      return categories.value.filter(c => c.type === 'spending')
    return categories.value
  }

  return { addCategory, updateCategory, deleteCategory, getCategories }
}
