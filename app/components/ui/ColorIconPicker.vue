<script setup lang="ts">
import {
  availableColors,
  availableIcons,
  colorHexMap
} from '~/constants/ui'

const props = withDefaults(
  defineProps<{
    color?: string
    icon?: string
    showColor?: boolean
    showIcon?: boolean
  }>(),
  {
    color: 'blue',
    icon: 'i-lucide-folder',
    showColor: true,
    showIcon: true
  }
)

const emit = defineEmits<{
  (e: 'update:color' | 'update:icon', val: string): void
}>()

const selectedColor = computed({
  get: () => props.color,
  set: (val: string) => emit('update:color', val)
})

const selectedIcon = computed({
  get: () => props.icon,
  set: (val: string) => emit('update:icon', val)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Color Selector -->
    <div v-if="showColor">
      <p class="text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
        Color Accent
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="c in availableColors"
          :key="c"
          type="button"
          :class="[
            'w-8 h-8 rounded-full border-2 transition-all duration-200 relative min-h-[32px] min-w-[32px]',
            selectedColor === c
              ? 'border-primary scale-110 shadow-sm'
              : 'border-transparent opacity-85 hover:opacity-100'
          ]"
          :style="{ backgroundColor: colorHexMap[c] || '#3b82f6' }"
          :aria-label="`Select color ${c}`"
          @click="selectedColor = c"
        >
          <UIcon
            v-if="selectedColor === c"
            name="i-lucide-check"
            class="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-sm"
          />
        </button>
      </div>
    </div>

    <!-- Icon Selector -->
    <div v-if="showIcon">
      <p class="text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">
        Icon Selector
      </p>
      <div
        class="grid grid-cols-5 gap-2 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 max-h-48 overflow-y-auto"
      >
        <button
          v-for="ic in availableIcons"
          :key="ic"
          type="button"
          :class="[
            'flex items-center justify-center p-2 rounded-lg border transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 min-h-[44px]',
            selectedIcon === ic
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-neutral-600 dark:text-neutral-400'
          ]"
          :aria-label="`Select icon ${ic}`"
          @click="selectedIcon = ic"
        >
          <UIcon
            :name="ic"
            class="w-6 h-6"
          />
        </button>
      </div>
    </div>
  </div>
</template>
