<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { computed, ref } from 'vue'
import AccountSettingsModal from '~/components/account/AccountSettingsModal.vue'

const { user, clear } = useUserSession()
const isAccountSettingsOpen = ref(false)

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    await navigateTo('/login')
  } catch (err) {
    console.error('Logout failed:', err)
  }
}

const dropdownItems = computed(() => [
  [
    {
      label: user.value?.name || 'Account',
      description: user.value?.email,
      avatar: { text: userInitials.value },
      type: 'label' as const
    }
  ],
  [
    {
      label: 'Account Settings',
      icon: 'i-lucide-user-cog',
      onSelect: () => {
        isAccountSettingsOpen.value = true
      }
    }
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: handleLogout
    }
  ]
])

const userInitials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return 'U'
  const parts = name.split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const items: NavigationMenuItem[][] = [
  [
    {
      label: 'Home',
      icon: 'i-lucide-house',
      to: '/'
    },
    {
      label: 'Budgets',
      icon: 'i-lucide-piggy-bank',
      to: '/budgets'
    },
    {
      label: 'Transactions',
      icon: 'i-lucide-arrow-right-left',
      to: '/transactions'
    },
    {
      label: 'Categories',
      icon: 'i-lucide-tag',
      to: '/categories'
    }
  ]
]
</script>

<template>
  <UDashboardSidebar
    collapsible
    resizable
    class="md:rounded-2xl md:border md:border-default md:bg-default md:shadow-xs md:overflow-hidden"
    :ui="{ footer: 'border-t border-default' }"
    :toggle="{
      color: 'primary',
      variant: 'soft',
      class: 'rounded-full'
    }"
  >
    <template #header="{ collapsed }">
      <div
        v-if="!collapsed"
        class="flex items-center gap-2 min-w-0"
      >
        <UIcon
          name="i-lucide-wallet"
          class="size-5 text-primary shrink-0"
        />
        <p class="font-bold text-base text-highlighted truncate">
          My Okane
        </p>
      </div>
      <UIcon
        v-else
        name="i-lucide-wallet"
        class="size-5 text-primary mx-auto"
      />

      <!-- This is the component used to toggle the sidebar's collapsed state on desktop -->
      <UDashboardSidebarCollapse class="ms-auto hidden md:inline-flex" />
    </template>

    <template #default="{ collapsed }">
      <UNavigationMenu
        :collapsed="collapsed"
        :items="items[0]"
        orientation="vertical"
      />
    </template>

    <template #footer="{ collapsed }">
      <UDropdownMenu
        v-if="user"
        :items="dropdownItems"
        :content="{ align: 'start', side: 'top', sideOffset: 8 }"
        :ui="{ content: 'w-[var(--reka-dropdown-menu-trigger-width)] min-w-52' }"
        class="w-full"
      >
        <UButton
          :avatar="{
            text: userInitials
          }"
          :label="collapsed ? undefined : user.name"
          :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
          color="neutral"
          variant="ghost"
          class="w-full justify-start"
          :ui="{ trailingIcon: 'ms-auto text-muted size-4' }"
          :block="collapsed"
          aria-label="User menu"
        />
      </UDropdownMenu>

      <AccountSettingsModal v-model:open="isAccountSettingsOpen" />
    </template>
  </UDashboardSidebar>
</template>
