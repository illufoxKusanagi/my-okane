<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const is404 = computed(() => props.error?.statusCode === 404)

const errorTitle = computed(() => {
  if (is404.value) return 'Page Not Found'
  return props.error?.statusMessage || 'An Unexpected Error Occurred'
})

const errorDescription = computed(() => {
  if (is404.value) {
    return 'The page you are looking for doesn\'t exist, has been removed, or is temporarily unavailable.'
  }
  return props.error?.message || 'Something went wrong while processing your request. Please try again.'
})

const handleClearError = () => {
  clearError({ redirect: '/' })
}

const handleRetry = () => {
  clearError()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950 font-sans">
    <UContainer class="max-w-md w-full text-center">
      <!-- Error Icon & Status Badge -->
      <div class="relative inline-flex items-center justify-center mb-6">
        <div class="w-20 h-20 rounded-3xl bg-neutral-200/60 dark:bg-neutral-800/60 flex items-center justify-center border border-neutral-300/50 dark:border-neutral-700/50 shadow-inner">
          <UIcon
            :name="is404 ? 'i-lucide-compass' : 'i-lucide-triangle-alert'"
            class="w-10 h-10"
            :class="is404 ? 'text-primary' : 'text-error'"
          />
        </div>
        <span
          class="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border shadow-xs"
          :class="is404 ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950 dark:text-primary-300 dark:border-primary-800' : 'bg-error-50 text-error-700 border-error-200 dark:bg-error-950 dark:text-error-300 dark:border-error-800'"
        >
          Error {{ error?.statusCode || 500 }}
        </span>
      </div>

      <!-- Heading & Description -->
      <h1 class="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight mb-3">
        {{ errorTitle }}
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
        {{ errorDescription }}
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <UButton
          icon="i-lucide-home"
          color="primary"
          size="lg"
          class="w-full sm:w-auto font-medium"
          @click="handleClearError"
        >
          Back to Dashboard
        </UButton>
        <UButton
          v-if="!is404"
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="outline"
          size="lg"
          class="w-full sm:w-auto"
          @click="handleRetry"
        >
          Try Again
        </UButton>
      </div>

      <!-- Quick Logo Footer -->
      <div class="mt-12 flex items-center justify-center gap-2 text-xs text-neutral-400 dark:text-neutral-600 font-medium">
        <UIcon
          name="i-lucide-wallet"
          class="w-4 h-4 text-primary"
        />
        <span>My Okane Financial Manager</span>
      </div>
    </UContainer>
  </div>
</template>
