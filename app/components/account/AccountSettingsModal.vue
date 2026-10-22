<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import ProfileTabForm from '~/components/account/ProfileTabForm.vue'
import PasswordTabForm from '~/components/account/PasswordTabForm.vue'

const isOpen = defineModel<boolean>('open', { required: true })

const tabItems = [
  {
    label: 'Profile',
    icon: 'i-lucide-user',
    value: 'profile',
    slot: 'profile'
  },
  {
    label: 'Security & Password',
    icon: 'i-lucide-key-round',
    value: 'password',
    slot: 'password'
  }
]
</script>

<template>
  <AppModal
    v-model:open="isOpen"
    title="Account Settings"
    description="Manage your account profile and security credentials"
  >
    <UTabs
      :items="tabItems"
      class="w-full"
    >
      <template #profile>
        <div class="pt-4">
          <ProfileTabForm
            @success="isOpen = false"
            @cancel="isOpen = false"
          />
        </div>
      </template>

      <template #password>
        <div class="pt-4">
          <PasswordTabForm
            @success="isOpen = false"
            @cancel="isOpen = false"
          />
        </div>
      </template>
    </UTabs>

    <template #actions>
      <span class="hidden" />
    </template>
  </AppModal>
</template>
