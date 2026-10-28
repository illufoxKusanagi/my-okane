<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const { t } = useI18n()

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
        title: t('account.profileUpdatedTitle'),
        description: t('account.profileUpdatedDesc'),
        color: 'success'
      })
      emit('success')
    }
  } catch (err: unknown) {
    toast.add({
      title: t('account.updateFailedTitle'),
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
      :label="$t('account.displayName')"
      name="name"
      required
    >
      <UInput
        v-model="name"
        :placeholder="$t('account.yourName')"
        icon="i-lucide-user"
        autocomplete="name"
        class="w-full"
      />
    </UFormField>

    <UFormField
      :label="$t('auth.emailAddress')"
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
        {{ $t('account.emailImmutableDesc') }}
      </p>
    </UFormField>

    <div class="flex justify-end gap-3 pt-4 border-t border-default mt-2">
      <UButton
        :label="$t('common.cancel')"
        color="neutral"
        variant="outline"
        :disabled="isProfileLoading"
        @click="emit('cancel')"
      />
      <UButton
        type="submit"
        :label="$t('common.saveChanges')"
        color="primary"
        :loading="isProfileLoading"
        :disabled="isProfileInvalid || isProfileLoading"
      />
    </div>
  </form>
</template>
