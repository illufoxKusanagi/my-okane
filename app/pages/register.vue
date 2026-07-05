<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8"
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
          Create an Account
        </h2>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Start tracking your transactions securely
        </p>
      </div>

      <UCard class="shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <UAlert
            v-if="errorMessage"
            color="red"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="errorMessage"
            class="mb-4"
          />

          <UFormField label="Full Name" name="name" required>
            <UInput
              v-model="name"
              type="text"
              placeholder="John Doe"
              icon="i-lucide-user"
              required
              size="lg"
            />
          </UFormField>

          <UFormField label="Email address" name="email" required>
            <UInput
              v-model="email"
              type="email"
              placeholder="you@example.com"
              icon="i-lucide-mail"
              required
              size="lg"
            />
          </UFormField>

          <UFormField label="Password" name="password" required>
            <UInput
              v-model="password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              required
              size="lg"
            />
          </UFormField>

          <UButton
            type="submit"
            color="primary"
            block
            size="lg"
            :loading="loading"
          >
            Create Account
          </UButton>
        </form>
      </UCard>

      <p class="text-center text-sm text-slate-600 dark:text-slate-400">
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

<script setup>
definePageMeta({
  layout: false,
});

const name = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

const { fetch: fetchSession } = useUserSession();

async function handleRegister() {
  if (loading.value) return;
  loading.value = true;
  errorMessage.value = "";

  try {
    await $fetch("/api/auth/register", {
      method: "POST",
      body: {
        name: name.value,
        email: email.value,
        password: password.value,
      },
    });

    await fetchSession();

    await navigateTo("/");
  } catch (err) {
    errorMessage.value =
      err.data?.statusMessage ||
      "Registration failed. Please check your inputs.";
  } finally {
    loading.value = false;
  }
}
</script>
