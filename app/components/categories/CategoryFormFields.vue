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
  <UFormField label="Category Name">
    <UInput
      v-model="name"
      class="w-full"
      placeholder="e.g. Health, Coffee, Salary"
      autofocus
    />
  </UFormField>

  <UFormField
    v-if="showTypeSelect"
    label="Category Type"
  >
    <USelect
      v-model="type"
      class="w-full"
      :items="[
        { label: 'Spending', value: 'spending' },
        { label: 'Income', value: 'income' }
      ]"
    />
  </UFormField>

  <ColorIconPicker
    v-model:color="color"
    v-model:icon="icon"
  />

  <div v-if="showExisting && existingCategories.length > 0">
    <p class="text-xs text-muted mb-2">
      Existing Categories
    </p>
    <div
      class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-muted/40 rounded-xl border border-muted"
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
