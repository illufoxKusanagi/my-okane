<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    submitLabel?: string
    cancelLabel?: string
    submitColor?: 'primary' | 'error' | 'neutral'
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    description: '',
    submitLabel: 'Save',
    cancelLabel: 'Cancel',
    submitColor: 'primary',
    loading: false,
    disabled: false
  }
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'submit' | 'cancel'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const handleCancel = () => {
  emit('cancel')
  isOpen.value = false
}

const handleSubmit = () => {
  if (!props.loading && !props.disabled) {
    emit('submit')
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description"
    :ui="{ footer: 'justify-end gap-3 has-[.hidden]:hidden' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <slot />
      </div>
    </template>

    <template #footer>
      <slot name="actions">
        <UButton
          :label="cancelLabel"
          color="neutral"
          variant="outline"
          :disabled="loading"
          @click="handleCancel"
        />
        <UButton
          :label="submitLabel"
          :color="submitColor"
          :loading="loading"
          :disabled="disabled || loading"
          @click="handleSubmit"
        />
      </slot>
    </template>
  </UModal>
</template>
