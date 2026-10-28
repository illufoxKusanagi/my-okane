<script setup lang="ts">
import { ref, computed } from 'vue'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'success' | 'cancel'): void
}>()

const toast = useToast()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isPasswordLoading = ref(false)
const passwordError = ref('')

const isPasswordInvalid = computed(
  () =>
    !currentPassword.value
    || !newPassword.value
    || newPassword.value.length < 8
    || newPassword.value !== confirmPassword.value
)

const passwordMismatch = computed(
  () =>
    confirmPassword.value.length > 0
    && newPassword.value !== confirmPassword.value
)

function resetForm() {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  passwordError.value = ''
}

function handleCancel() {
  resetForm()
  emit('cancel')
}

async function handleChangePassword() {
  if (isPasswordInvalid.value || isPasswordLoading.value) return
  isPasswordLoading.value = true
  passwordError.value = ''

  try {
    const res = await $fetch<{ success: boolean, message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      }
    })

    if (res.success) {
      toast.add({
        title: t('account.passwordChangedTitle'),
        description: t('account.passwordChangedDesc'),
        color: 'success'
      })
      resetForm()
      emit('success')
    }
  } catch (err: unknown) {
    passwordError.value = describeApiError(err, 'Failed to change password')
  } finally {
    isPasswordLoading.value = false
  }
}
</script>

<template>
  <form
    class="flex flex-col gap-4"
    @submit.prevent="handleChangePassword"
  >
    <UAlert
      v-if="passwordError"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-circle"
      :title="$t('account.passwordUpdateFailedTitle')"
      :description="passwordError"
    />

    <UFormField
      :label="$t('account.currentPassword')"
      name="currentPassword"
      required
    >
      <UInput
        v-model="currentPassword"
        :type="showCurrentPassword ? 'text' : 'password'"
        placeholder="••••••••"
        icon="i-lucide-lock"
        autocomplete="current-password"
        class="w-full"
      >
        <template #trailing>
          <UButton
            color="neutral"
            variant="link"
            size="sm"
            :icon="showCurrentPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            :aria-label="$t('auth.togglePasswordVisibility')"
            @click="showCurrentPassword = !showCurrentPassword"
          />
        </template>
      </UInput>
    </UFormField>

    <UFormField
      :label="$t('account.newPassword')"
      name="newPassword"
      required
    >
      <UInput
        v-model="newPassword"
        :type="showNewPassword ? 'text' : 'password'"
        placeholder="••••••••"
        icon="i-lucide-key-round"
        autocomplete="new-password"
        class="w-full"
      >
        <template #trailing>
          <UButton
            color="neutral"
            variant="link"
            size="sm"
            :icon="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            :aria-label="$t('auth.togglePasswordVisibility')"
            @click="showNewPassword = !showNewPassword"
          />
        </template>
      </UInput>
      <p class="text-xs text-muted mt-1">
        {{ $t('auth.min8Chars') }}
      </p>
    </UFormField>

    <UFormField
      :label="$t('account.confirmNewPassword')"
      name="confirmPassword"
      required
    >
      <UInput
        v-model="confirmPassword"
        :type="showConfirmPassword ? 'text' : 'password'"
        placeholder="••••••••"
        icon="i-lucide-key-round"
        autocomplete="new-password"
        class="w-full"
      >
        <template #trailing>
          <UButton
            color="neutral"
            variant="link"
            size="sm"
            :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            :aria-label="$t('auth.togglePasswordVisibility')"
            @click="showConfirmPassword = !showConfirmPassword"
          />
        </template>
      </UInput>
      <p
        v-if="passwordMismatch"
        class="text-xs text-error mt-1"
      >
        {{ $t('auth.passwordMismatch') }}
      </p>
    </UFormField>

    <div class="flex justify-end gap-3 pt-4 border-t border-default mt-2">
      <UButton
        :label="$t('common.cancel')"
        color="neutral"
        variant="outline"
        :disabled="isPasswordLoading"
        @click="handleCancel"
      />
      <UButton
        type="submit"
        :label="$t('account.updatePasswordBtn')"
        color="primary"
        :loading="isPasswordLoading"
        :disabled="isPasswordInvalid || isPasswordLoading"
      />
    </div>
  </form>
</template>
