<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: false
})

useSeoMeta({
  title: 'Forgot Password'
})

const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const isSubmitted = ref(false)

async function handleForgotPassword() {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: {
        email: email.value.trim()
      }
    })
    isSubmitted.value = true
  } catch (err: unknown) {
    errorMessage.value = describeApiError(
      err,
      'Something went wrong. Please try again.'
    )
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-default px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center p-3 bg-primary-500/10 rounded-2xl mb-4"
        >
          <UIcon
            name="i-lucide-wallet"
            class="h-10 w-10 text-primary-500"
          />
        </div>
        <h2
          class="text-3xl font-bold tracking-tight text-highlighted"
        >
          Forgot Your Password?
        </h2>
        <p class="mt-2 text-sm text-muted">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <UCard
        class="shadow-xl shadow-neutral-950/5 border border-default backdrop-blur-sm"
      >
        <template v-if="isSubmitted">
          <UAlert
            color="success"
            variant="subtle"
            icon="i-lucide-circle-check"
            title="Check your email"
            description="If an account exists for that email, a password reset link has been sent. The link expires in 10 minutes."
            class="mb-4"
          />
        </template>

        <form
          v-else
          class="space-y-4"
          @submit.prevent="handleForgotPassword"
        >
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="subtle"
            icon="i-lucide-alert-circle"
            title="Request failed"
            :description="errorMessage"
            class="mb-2"
          />

          <UFormField
            label="Email address"
            name="email"
            required
            class="w-full"
          >
            <UInput
              v-model="email"
              type="email"
              placeholder="you@example.com"
              icon="i-lucide-mail"
              autocomplete="email"
              required
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            color="primary"
            block
            size="lg"
            :loading="loading"
          >
            Send Reset Link
          </UButton>
        </form>
      </UCard>

      <p class="text-center text-sm text-muted">
        Remembered it?
        <NuxtLink
          to="/login"
          class="font-medium text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          Back to sign in
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
