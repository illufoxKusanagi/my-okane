<template>
  <div
    class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 sm:px-6 lg:px-8"
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
          class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
          Welcome Back
        </h2>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in to manage your finance
        </p>
      </div>

      <!-- Registration Success Message -->
      <UAlert
        v-if="isRegistered"
        color="success"
        variant="subtle"
        icon="i-lucide-circle-check"
        title="Account Created Successfully"
        description="Please enter your password to sign in to your new account."
        class="mb-6"
      />

      <!-- Error Message -->
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        :title="errorMessage"
        class="mb-6"
      />

      <UCard
        class="shadow-xl shadow-neutral-950/5 border-neutral-200/80 dark:border-neutral-800 backdrop-blur-sm"
      >
        <form
          class="space-y-4"
          @submit.prevent="handleLogin"
        >
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
              autocomplete="current-password"
              :autofocus="isRegistered || !!email"
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

          <UButton
            type="submit"
            color="primary"
            block
            size="lg"
            :loading="loading"
          >
            Sign In
          </UButton>
        </form>
      </UCard>

      <p class="text-center text-sm text-slate-600 dark:text-slate-400">
        Don't have an account?
        <NuxtLink
          to="/register"
          class="font-medium text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          Sign up for free
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false
})

const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const isRegistered = ref(false)
const toast = useToast()

onMounted(() => {
  if (route.query.email) {
    email.value = String(route.query.email)
  }
  if (route.query.registered === 'true') {
    isRegistered.value = true
  }
})

const { fetch: fetchSession } = useUserSession()

async function handleLogin() {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value.trim(),
        password: password.value
      }
    })

    await fetchSession()

    await navigateTo('/')
  } catch (err: unknown) {
    errorMessage.value = describeApiError(err, 'Invalid email or password.')
    toast.add({
      title: 'Login Failed',
      description: errorMessage.value,
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    loading.value = false
  }
}
</script>
