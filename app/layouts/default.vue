<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { computed, ref } from 'vue'
import AccountSettingsModal from '~/components/account/AccountSettingsModal.vue'

const open = ref(true)
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

const userInitials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return 'U'
  const parts = name.split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

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

const items: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
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
</script>

<template>
  <div
    class="flex min-w-0 flex-col flex-1 h-dvh overflow-hidden bg-muted/20 dark:bg-neutral-950"
    style="--ui-header-height: 3.5rem"
  >
    <!-- Top Header matching data_warehouse architecture -->
    <UHeader
      toggle-side="left"
      title="My Okane"
      :ui="{
        root: 'h-auto border-b-0 bg-transparent',
        container: 'max-w-none flex items-center justify-between gap-3 px-4 py-2 min-h-[56px]',
        left: 'flex items-center gap-3 min-w-0',
        right: 'flex items-center gap-2',
        toggle: 'flex'
      }"
    >
      <template #toggle>
        <UButton
          :icon="open ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'"
          color="neutral"
          variant="ghost"
          aria-label="Toggle sidebar"
          @click="open = !open"
        />
      </template>

      <template #left>
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UIcon
              name="i-lucide-wallet"
              class="size-5 text-primary"
            />
          </div>
          <div class="flex flex-col leading-tight min-w-0">
            <span class="font-bold text-base text-highlighted truncate">My Okane</span>
            <span class="text-xs text-muted truncate">Personal Finance</span>
          </div>
        </div>
      </template>

      <template #right>
        <ColorModeButton />

        <UDropdownMenu
          v-if="user"
          :items="dropdownItems"
          :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
        >
          <UButton
            :avatar="{ text: userInitials }"
            :label="user.name"
            trailing-icon="i-lucide-chevrons-up-down"
            color="neutral"
            variant="ghost"
            class="hidden sm:inline-flex"
            aria-label="User menu"
          />
          <UButton
            :avatar="{ text: userInitials }"
            color="neutral"
            variant="ghost"
            class="sm:hidden"
            aria-label="User menu"
          />
        </UDropdownMenu>
      </template>
    </UHeader>

    <!-- Floating Canvas Body: Sidebar + Main UCard -->
    <div class="relative flex min-w-0 flex-1 min-h-0 overflow-hidden">
      <USidebar
        v-model:open="open"
        variant="floating"
        collapsible="offcanvas"
        :ui="{
          container: 'absolute inset-y-0 start-0 h-full p-2 border-transparent',
          body: 'px-3 mx-0'
        }"
      >
        <UNavigationMenu
          :items="items"
          orientation="vertical"
          :ui="{ link: 'py-2 overflow-hidden' }"
        />
      </USidebar>

      <div class="flex-1 min-h-0 min-w-0 flex flex-col p-2 lg:p-3">
        <UCard
          class="flex-1 min-h-0 min-w-0 flex flex-col shadow-xs"
          :ui="{ body: 'flex-1 min-h-0 min-w-0 overflow-y-auto p-0 sm:p-0' }"
        >
          <slot />
        </UCard>
      </div>
    </div>

    <AccountSettingsModal v-model:open="isAccountSettingsOpen" />
  </div>
</template>
