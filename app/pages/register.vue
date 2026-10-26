<template>
  <div
    class="min-h-screen flex items-center justify-center bg-default px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <!-- Logo/Icon -->
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
          Create an Account
        </h2>
        <p class="mt-2 text-sm text-muted">
          Start tracking your transactions securely
        </p>
      </div>

      <UCard class="shadow-xl border border-default">
        <form
          class="space-y-6"
          @submit.prevent="handleRegister"
        >
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            title="Registration Failed"
            :description="errorMessage"
            class="mb-4"
          />

          <UFormField
            label="Full Name"
            name="name"
            required
            class="w-full"
          >
            <UInput
              v-model="name"
              type="text"
              placeholder="John Doe"
              icon="i-lucide-user"
              autocomplete="name"
              required
              size="lg"
              class="w-full"
            />
          </UFormField>

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

          <UFormField
            label="Password"
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

          <UButton
            type="submit"
            color="primary"
            block
            size="lg"
            :loading="loading"
            :disabled="loading"
          >
            Create Account
          </UButton>
        </form>
      </UCard>

      <p class="text-center text-sm text-muted">
        Already have an account?
        <NuxtLink
          to="/login"
          class="font-medium text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          Sign in instead
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

useSeoMeta({
  title: 'Sign Up'
})

const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

async function handleRegister() {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''

  try {
    const userEmail = email.value.trim()
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: name.value.trim(),
        email: userEmail,
        password: password.value
      }
    })

    await navigateTo({
      path: '/login',
      query: {
        email: userEmail,
        registered: 'true'
      }
    })
  } catch (err: unknown) {
    errorMessage.value = describeApiError(err, 'Registration failed. Please check your inputs.')
  } finally {
    loading.value = false
  }
}
</script>
