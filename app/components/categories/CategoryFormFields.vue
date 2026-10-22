<script setup lang="ts">
import ColorIconPicker from '~/components/ui/ColorIconPicker.vue'
import { colorClassMap } from '~/constants/ui'

const props = withDefaults(
  defineProps<{
    fixedType?: 'spending' | 'income'
    showType?: boolean
    showExisting?: boolean
  }>(),
  {
    fixedType: undefined,
    showType: true,
    showExisting: false
  }
)

const name = defineModel<string>('name', { required: true })
const color = defineModel<string>('color', { required: true })
const icon = defineModel<string>('icon', { required: true })
const type = defineModel<'spending' | 'income'>('type', { default: 'spending' })

const { getCategories } = useFinance()

const showTypeSelect = computed(() => props.showType && !props.fixedType)
const effectiveType = computed(() => props.fixedType ?? type.value)
const existingCategories = computed(() =>
  props.showExisting ? getCategories(effectiveType.value) : []
)
</script>

<template>
  <div>
    <p class="text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
      Category Name
    </p>
    <UInput
      v-model="name"
      class="w-full"
      placeholder="e.g. Health, Coffee, Salary"
      autofocus
    />
  </div>

  <div v-if="showTypeSelect">
    <p class="text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
      Category Type
    </p>
    <USelect
      v-model="type"
      class="w-full"
      :items="[
        { label: 'Spending', value: 'spending' },
        { label: 'Income', value: 'income' }
      ]"
    />
  </div>

  <ColorIconPicker
    v-model:color="color"
    v-model:icon="icon"
  />

  <div v-if="showExisting && existingCategories.length > 0">
    <p class="text-xs text-neutral-400 dark:text-neutral-500 mb-2">
      Existing Categories
    </p>
    <div
      class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-neutral-50/50 dark:bg-neutral-900/20 rounded-xl border border-neutral-200/30 dark:border-neutral-800/30"
    >
      <UBadge
        v-for="cat in existingCategories"
        :key="cat.id"
        variant="outline"
        :class="colorClassMap[cat.color || 'slate']"
      >
        {{ cat.name }}
      </UBadge>
    </div>
  </div>
</template>
