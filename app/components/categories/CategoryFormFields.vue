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
  <UFormField :label="$t('categories.fields.name')">
    <UInput
      v-model="name"
      class="w-full"
      :placeholder="$t('categories.fields.placeholder')"
      autofocus
    />
  </UFormField>

  <UFormField
    v-if="showTypeSelect"
    :label="$t('categories.fields.type')"
  >
    <USelect
      v-model="type"
      class="w-full"
      :items="[
        { label: $t('categories.spending'), value: 'spending' },
        { label: $t('categories.income'), value: 'income' }
      ]"
    />
  </UFormField>

  <ColorIconPicker
    v-model:color="color"
    v-model:icon="icon"
  />

  <div v-if="showExisting && existingCategories.length > 0">
    <p class="text-xs text-muted mb-2">
      {{ $t('categories.existingCategories') }}
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
