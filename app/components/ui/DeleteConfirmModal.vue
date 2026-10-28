<script setup lang="ts">
import { computed } from 'vue'
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
    :submit-label="$t('common.delete')"
    submit-color="error"
    :loading="loading"
    @submit="emit('confirm')"
  >
    <div class="flex items-center gap-3 text-error mb-2">
      <UIcon
        name="i-lucide-triangle-alert"
        class="w-6 h-6"
      />
      <span class="font-semibold">{{ $t('common.warningIrreversible') }}</span>
    </div>
    <p class="text-sm text-muted">
      <slot />
    </p>
  </AppModal>
</template>
