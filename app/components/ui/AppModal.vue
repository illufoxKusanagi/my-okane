<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    submitLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    description: "",
    submitLabel: "Save",
    cancelLabel: "Cancel",
    loading: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "submit"): void;
  (e: "cancel"): void;
}>();

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit("update:open", val),
});

const handleCancel = () => {
  emit("cancel");
  isOpen.value = false;
};

const handleSubmit = () => {
  if (!props.loading && !props.disabled) {
    emit("submit");
  }
};
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <UContainer class="p-6 flex flex-col gap-5 w-full">
        <div>
          <h3 class="text-lg font-bold text-neutral-800 dark:text-neutral-100">
            {{ title }}
          </h3>
          <p v-if="description" class="text-xs text-neutral-500 mt-1">
            {{ description }}
          </p>
        </div>

        <div class="flex flex-col gap-4">
          <slot />
        </div>

        <div
          class="flex justify-end gap-3 mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4"
        >
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
              color="primary"
              :loading="loading"
              :disabled="disabled || loading"
              @click="handleSubmit"
            />
          </slot>
        </div>
      </UContainer>
    </template>
  </UModal>
</template>
