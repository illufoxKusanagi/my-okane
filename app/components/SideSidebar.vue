<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { computed } from 'vue'

const { user, clear } = useUserSession()

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
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      onSelect: handleLogout
    }
  ]
])

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
        <p class="font-bold text-base text-neutral-850 dark:text-neutral-100 truncate">
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
      <UButton
        :label="collapsed ? undefined : 'Search...'"
        icon="i-lucide-search"
        color="neutral"
        variant="outline"
        block
        :square="collapsed"
      >
        <template
          v-if="!collapsed"
          #trailing
        >
          <div class="flex items-center gap-0.5 ms-auto">
            <UKbd
              value="meta"
              variant="subtle"
            />
            <UKbd
              value="K"
              variant="subtle"
            />
          </div>
        </template>
      </UButton>

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
        :content="{ align: 'start' }"
        class="w-full"
      >
        <UButton
          :avatar="{
            src: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
            loading: 'lazy' as const
          }"
          :label="collapsed ? undefined : user.name"
          color="neutral"
          variant="ghost"
          class="w-full"
          :block="collapsed"
        />
      </UDropdownMenu>
    </template>
  </UDashboardSidebar>
</template>
