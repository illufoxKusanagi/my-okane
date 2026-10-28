<script setup lang="ts">
const { locale, setLocale } = useI18n()

const currentLocaleLabel = computed(() =>
  locale.value === 'id' ? 'ID' : 'EN'
)

const currentLocaleIcon = computed(() =>
  locale.value === 'id' ? 'i-circle-flags-id' : 'i-circle-flags-us'
)

const items = computed(() => [
  [
    {
      label: 'Bahasa Indonesia',
      icon: 'i-circle-flags-id',
      trailingIcon: locale.value === 'id' ? 'i-lucide-check' : undefined,
      onSelect: () => setLocale('id')
    },
    {
      label: 'English',
      icon: 'i-circle-flags-us',
      trailingIcon: locale.value === 'en' ? 'i-lucide-check' : undefined,
      onSelect: () => setLocale('en')
    }
  ]
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }">
    <UButton
      :icon="currentLocaleIcon"
      color="neutral"
      variant="ghost"
      size="sm"
      :aria-label="`Switch language (Current: ${currentLocaleLabel})`"
    >
      <span class="text-xs font-semibold uppercase">{{ currentLocaleLabel }}</span>
    </UButton>
  </UDropdownMenu>
</template>
