<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { t } = useI18n()

definePageMeta({
  layout: false
})

useSeoMeta({
  title: () => t('auth.signInTitle')
})

const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const isRegistered = ref(false)

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
    errorMessage.value = describeApiError(err, t('auth.loginFailed'))
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
          {{ $t('auth.welcomeBack') }}
        </h2>
        <p class="mt-2 text-sm text-muted">
          {{ $t('auth.signInSubtitle') }}
        </p>
      </div>

      <!-- Registration Success Message -->
      <UAlert
        v-if="isRegistered"
        color="success"
        variant="subtle"
        icon="i-lucide-circle-check"
        :title="$t('auth.accountCreatedTitle')"
        :description="$t('auth.accountCreatedDesc')"
        class="mb-6"
      />

      <!-- Error Message -->
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        :title="$t('auth.signInFailedTitle')"
        :description="errorMessage"
        class="mb-6"
      />
      />

      <UCard
        class="shadow-xl shadow-neutral-950/5 border border-default backdrop-blur-sm"
      >
        <form
          class="space-y-4"
          @submit.prevent="handleLogin"
        >
          <UFormField
            :label="$t('auth.emailAddress')"
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
            :label="$t('auth.password')"
            name="password"
            required
            class="w-full"
          >
            <template #hint>
              <ULink
                to="/forgot-password"
                class="text-xs text-primary font-medium hover:underline cursor-pointer"
                tabindex="0"
                @click.stop
              >
                {{ $t('auth.forgotPassword') }}
              </ULink>
            </template>

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
                  :aria-label="$t('auth.togglePasswordVisibility')"
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
            :disabled="loading"
          >
            {{ $t('auth.signIn') }}
          </UButton>
        </form>
      </UCard>

      <p class="text-center text-sm text-muted">
        {{ $t('auth.dontHaveAccount') }}
        <ULink
          to="/register"
          class="font-medium text-primary hover:underline transition-colors"
        >
          {{ $t('auth.signUpForFree') }}
        </ULink>
      </p>
    </div>
  </div>
</template>
