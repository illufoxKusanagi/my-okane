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
          <UIcon name="i-lucide-wallet" class="h-10 w-10 text-primary-500" />
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

      <UCard class="shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="errorMessage"
            class="mb-4"
          />

          <UFormField label="Email address" name="email" required class="w-full">
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

          <UFormField label="Password" name="password" required class="w-full">
            <UInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              icon="i-lucide-lock"
              autocomplete="current-password"
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
definePageMeta({
  layout: false,
});

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref("");

const { fetch: fetchSession } = useUserSession();

async function handleLogin() {
  if (loading.value) return;
  loading.value = true;
  errorMessage.value = "";

  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        email: email.value,
        password: password.value,
      },
    });

    await fetchSession();

    await navigateTo("/");
  } catch (err: any) {
    errorMessage.value =
      err.data?.message || err.data?.statusMessage || "Invalid email or password.";
  } finally {
    loading.value = false;
  }
}
</script>
