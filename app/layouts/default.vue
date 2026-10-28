<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { computed, ref, watch, onMounted } from 'vue'
import AccountSettingsModal from '~/components/account/AccountSettingsModal.vue'
import LanguageSwitcher from '~/components/ui/LanguageSwitcher.vue'

const { t } = useI18n()
const route = useRoute()
const open = ref(true)
const { user, clear } = useUserSession()
const isAccountSettingsOpen = ref(false)

const closeSidebarIfMobile = () => {
  if (import.meta.client && window.innerWidth < 1024) {
    open.value = false
  }
}

watch(() => route.path, closeSidebarIfMobile)

onMounted(closeSidebarIfMobile)

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
      label: user.value?.name || t('nav.account'),
      description: user.value?.email,
      avatar: { text: userInitials.value },
      type: 'label' as const
    }
  ],
  [
    {
      label: t('nav.accountSettings'),
      icon: 'i-lucide-user-cog',
      onSelect: () => {
        isAccountSettingsOpen.value = true
      }
    }
  ],
  [
    {
      label: t('nav.signOut'),
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: handleLogout
    }
  ]
])

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: t('nav.home'),
    icon: 'i-lucide-layout-dashboard',
    to: '/'
  },
  {
    label: t('nav.budgets'),
    icon: 'i-lucide-piggy-bank',
    to: '/budgets'
  },
  {
    label: t('nav.transactions'),
    icon: 'i-lucide-arrow-right-left',
    to: '/transactions'
  },
  {
    label: t('nav.categories'),
    icon: 'i-lucide-tag',
    to: '/categories'
  }
])
</script>

<template>
  <div
    class="flex min-w-0 flex-col flex-1 h-dvh overflow-hidden bg-muted/20 dark:bg-neutral-950"
    style="--ui-header-height: 3.5rem"
  >
    <!-- Top Header matching AppSidebar architecture -->
    <UHeader
      toggle-side="left"
      :ui="{
        root: 'h-auto border-b-0',
        container:
          'max-w-none flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3',
        left: 'flex items-center gap-2 sm:gap-3 min-w-0 flex-1',
        right: 'flex items-center justify-end gap-1.5 sm:gap-2 shrink-0',
        toggle: 'flex'
      }"
    >
      <template #toggle>
        <UButton
          :icon="
            open ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'
          "
          color="neutral"
          variant="ghost"
          :aria-label="$t('nav.toggleSidebar')"
          @click="open = !open"
        />
      </template>

      <template #left>
        <div class="flex flex-col leading-tight min-w-0">
          <h1
            class="text-lg sm:text-xl xl:text-2xl font-bold tracking-tight text-highlighted truncate"
          >
            {{ $t('dashboard.greeting', { name: user?.name || 'User' }) }}
          </h1>
        </div>
      </template>

      <template #right>
        <LanguageSwitcher class="h-9 shrink-0" />
        <ColorModeButton class="h-9 shrink-0" />

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
            class="h-9 shrink-0"
            :ui="{
              label: 'hidden sm:inline truncate max-w-32',
              trailingIcon: 'hidden sm:inline'
            }"
            :aria-label="$t('nav.userMenu')"
          />
        </UDropdownMenu>
      </template>
    </UHeader>

    <!-- Floating Canvas Body: Sidebar + Main UCard -->
    <div class="relative flex min-w-0 flex-1 min-h-0 overflow-hidden">
      <USidebar
        v-model:open="open"
        variant="floating"
        collapsible="icon"
        :ui="{ container: 'absolute start-0 h-full border-transparent' }"
      >
        <template #header>
          <div class="flex flex-row justify-between w-full">
            <div class="flex items-center gap-2.5 w-full min-w-0">
              <img
                src="/pwa-192x192.png"
                alt="My Okane"
                class="size-8 rounded-md"
              >
              <p
                v-if="open"
                class="font-semibold text-highlighted truncate leading-none"
              >
                My Okane
              </p>
            </div>
            <UButton
              :icon="
                open ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'
              "
              color="neutral"
              variant="ghost"
              :aria-label="$t('nav.toggleSidebar')"
              class="lg:hidden"
              @click="open = !open"
            />
          </div>
        </template>

        <UNavigationMenu
          :items="items"
          :collapsed="!open"
          orientation="vertical"
          tooltip
          @click="closeSidebarIfMobile"
        />
      </USidebar>

      <div class="flex-1 min-h-0 min-w-0 flex flex-col py-4 pr-4 pl-4 lg:pl-0">
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
