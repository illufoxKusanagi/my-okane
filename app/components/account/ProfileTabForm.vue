<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'success' | 'cancel'): void
}>()

const { user, fetch: fetchSession } = useUserSession()
const toast = useToast()

const name = ref(user.value?.name || '')
const periodStartDay = ref(user.value?.periodStartDay ?? 1)
const isProfileLoading = ref(false)

watch(
  () => user.value,
  (newUser) => {
    if (newUser?.name) {
      name.value = newUser.name
    }
    if (newUser?.periodStartDay !== undefined) {
      periodStartDay.value = newUser.periodStartDay
    }
  },
  { immediate: true }
)

const periodStartDayOptions = computed(() =>
  Array.from({ length: 28 }, (_, i) => ({
    label: t('account.dayOfEveryMonth', { day: i + 1 }),
    value: i + 1
  }))
)

const isProfileInvalid = computed(() => {
  const isNameEmpty = !name.value.trim()
  const hasNameChanged = name.value.trim() !== user.value?.name
  const hasPeriodChanged = Number(periodStartDay.value) !== (user.value?.periodStartDay ?? 1)
  return isNameEmpty || (!hasNameChanged && !hasPeriodChanged)
})

async function handleSaveProfile() {
  if (isProfileInvalid.value || isProfileLoading.value) return
  isProfileLoading.value = true

  try {
    const res = await $fetch<{ success: boolean, user: { name: string, periodStartDay: number } }>('/api/auth/profile', {
      method: 'PUT',
      body: {
        name: name.value.trim(),
        periodStartDay: Number(periodStartDay.value)
      }
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

    <UFormField
      :label="$t('account.periodStartDay')"
      name="periodStartDay"
      :description="$t('account.periodStartDayDesc')"
    >
      <USelect
        v-model="periodStartDay"
        :items="periodStartDayOptions"
        icon="i-lucide-calendar"
        class="w-full"
      />
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
