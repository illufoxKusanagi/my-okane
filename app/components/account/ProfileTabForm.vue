<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const emit = defineEmits<{
  (e: 'success' | 'cancel'): void
}>()

const { user, fetch: fetchSession } = useUserSession()
const toast = useToast()

const name = ref(user.value?.name || '')
const isProfileLoading = ref(false)

watch(
  () => user.value?.name,
  (newName) => {
    if (newName) {
      name.value = newName
    }
  },
  { immediate: true }
)

const isProfileInvalid = computed(
  () => !name.value.trim() || name.value.trim() === user.value?.name
)

async function handleSaveProfile() {
  if (isProfileInvalid.value || isProfileLoading.value) return
  isProfileLoading.value = true

  try {
    const res = await $fetch<{ success: boolean, user: { name: string } }>('/api/auth/profile', {
      method: 'PUT',
      body: { name: name.value.trim() }
    })

    if (res.success) {
      await fetchSession()
      toast.add({
        title: 'Profile Updated',
        description: 'Your display name has been updated.',
        color: 'success'
      })
      emit('success')
    }
  } catch (err: unknown) {
    toast.add({
      title: 'Update Failed',
      description: describeApiError(err, 'Failed to update profile'),
      color: 'error'
    })
  } finally {
    isProfileLoading.value = false
  }
}
</script>

<template>
  <form
    class="flex flex-col gap-4"
    @submit.prevent="handleSaveProfile"
  >
    <UFormField
      label="Display name"
      name="name"
      required
    >
      <UInput
        v-model="name"
        placeholder="Your name"
        icon="i-lucide-user"
        autocomplete="name"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Email address"
      name="email"
    >
      <UInput
        :model-value="user?.email"
        type="email"
        disabled
        icon="i-lucide-mail"
        class="w-full opacity-70 cursor-not-allowed"
      />
      <p class="text-xs text-muted mt-1">
        Email address is permanent and cannot be modified.
      </p>
    </UFormField>

    <div class="flex justify-end gap-3 pt-4 border-t border-default mt-2">
      <UButton
        label="Cancel"
        color="neutral"
        variant="outline"
        :disabled="isProfileLoading"
        @click="emit('cancel')"
      />
      <UButton
        type="submit"
        label="Save Profile"
        color="primary"
        :loading="isProfileLoading"
        :disabled="isProfileInvalid || isProfileLoading"
      />
    </div>
  </form>
</template>
