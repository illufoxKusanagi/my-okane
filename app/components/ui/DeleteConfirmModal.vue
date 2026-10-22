<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    loading?: boolean
  }>(),
  {
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})
</script>

<template>
  <AppModal
    v-model:open="isOpen"
    :title="title"
    submit-label="Delete"
    :loading="loading"
    @submit="emit('confirm')"
  >
    <div class="flex items-center gap-3 text-error mb-2">
      <UIcon
        name="i-lucide-triangle-alert"
        class="w-6 h-6"
      />
      <span class="font-semibold">Warning: Irreversible Action</span>
    </div>
    <p class="text-sm text-neutral-600 dark:text-neutral-400">
      <slot />
    </p>
  </AppModal>
</template>
