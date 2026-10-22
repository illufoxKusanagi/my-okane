<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false
})

const route = useRoute()

const isReady = ref(false)
const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const isSuccess = ref(false)

const extractToken = (): string => {
  // Preferred: URL fragment — never sent to the server in the request line.
  const fromHash = new URLSearchParams(route.hash.replace(/^#/, '')).get(
    'token'
  )
  if (fromHash) return fromHash
  // Fallback for clients that mangle fragments into the query string.
  return typeof route.query.token === 'string' ? route.query.token : ''
}

onMounted(() => {
  token.value = extractToken()
  isReady.value = true
})

const isInvalid = () =>
  !password.value
  || password.value.length < 8
  || password.value !== confirmPassword.value

const passwordMismatch = () =>
  confirmPassword.value.length > 0 && password.value !== confirmPassword.value

async function handleReset() {
  if (loading.value || isInvalid()) return
  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value
      }
    })
    isSuccess.value = true
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
          Set New Password
        </h2>
        <p class="mt-2 text-sm text-muted">
          Choose a new password for your account
        </p>
      </div>

      <!-- Token is read client-side only (URL fragment); avoid SSR mismatch -->
      <USkeleton
        v-if="!isReady"
        class="h-64 rounded-2xl w-full"
      />

      <UCard
        v-else-if="!token"
        class="shadow-xl shadow-neutral-950/5 border border-default backdrop-blur-sm"
      >
        <UAlert
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="Invalid link"
          description="This password reset link is missing or malformed. Request a new one below."
          class="mb-4"
        />
        <UButton
          label="Request a new link"
          color="primary"
          block
          size="lg"
          to="/forgot-password"
        />
      </UCard>

      <UCard
        v-else-if="isSuccess"
        class="shadow-xl shadow-neutral-950/5 border border-default backdrop-blur-sm"
      >
        <UAlert
          color="success"
          variant="subtle"
          icon="i-lucide-circle-check"
          title="Password updated"
          description="Your password has been changed. All other sessions have been signed out."
          class="mb-4"
        />
        <UButton
          label="Sign In"
          color="primary"
          block
          size="lg"
          to="/login"
        />
      </UCard>

      <UCard
        v-else
        class="shadow-xl shadow-neutral-950/5 border border-default backdrop-blur-sm"
      >
        <form
          class="space-y-4"
          @submit.prevent="handleReset"
        >
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="subtle"
            icon="i-lucide-alert-circle"
            title="Reset failed"
            :description="errorMessage"
            class="mb-2"
          />

          <UFormField
            label="New password"
            name="password"
            required
            class="w-full"
          >
            <UInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              icon="i-lucide-lock"
              autocomplete="new-password"
              required
              size="lg"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  aria-label="Toggle password visibility"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormField>
          <p class="text-xs text-muted -mt-4">
            Must be at least 8 characters.
          </p>

          <UFormField
            label="Confirm password"
            name="confirmPassword"
            required
            class="w-full"
          >
            <UInput
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              icon="i-lucide-lock"
              autocomplete="new-password"
              required
              size="lg"
              class="w-full"
            />
          </UFormField>
          <p
            v-if="passwordMismatch()"
            class="text-xs text-rose-600 dark:text-rose-400 -mt-4"
          >
            Passwords do not match.
          </p>

          <UButton
            type="submit"
            color="primary"
            block
            size="lg"
            :loading="loading"
            :disabled="isInvalid()"
          >
            Reset Password
          </UButton>
        </form>
      </UCard>

      <p class="text-center text-sm text-muted">
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
