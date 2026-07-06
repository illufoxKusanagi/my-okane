<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { computed } from "vue";

const { user, clear } = useUserSession();

const handleLogout = async () => {
  try {
    await $fetch("/api/auth/logout", { method: "POST" });
    await clear();
    await navigateTo("/login");
  } catch (err) {
    console.error("Logout failed:", err);
  }
};

const dropdownItems = computed(() => [
  [
    {
      label: "Sign out",
      icon: "i-lucide-log-out",
      onSelect: handleLogout,
    },
  ],
]);

const items: NavigationMenuItem[][] = [
  [
    {
      label: "Home",
      icon: "i-lucide-house",
      to: "/",
    },
    {
      label: "Budgets",
      icon: "i-lucide-piggy-bank",
      to: "/budgets",
    },
    {
      label: "Transactions",
      icon: "i-lucide-arrow-right-left",
      to: "/transactions",
    },
    {
      label: "Categories",
      icon: "i-lucide-tag",
      to: "/categories",
    },
  ],
  [
    {
      label: "Feedback",
      icon: "i-lucide-message-circle",
      to: "https://github.com/nuxt-ui-templates/dashboard",
      target: "_blank",
    },
    {
      label: "Help & Support",
      icon: "i-lucide-info",
      to: "https://github.com/nuxt/ui",
      target: "_blank",
    },
  ],
];
</script>

<template>
  <UDashboardSidebar
    collapsible
    resizable
    :ui="{ footer: 'border-t border-default' }"
    :toggle="{
      color: 'primary',
      variant: 'soft',
      class: 'rounded-full',
    }"
  >
    <template #header="{ collapsed }">
      <!-- <Logo v-if="!collapsed" class="h-5 w-auto shrink-0" /> -->
      <!-- <UIcon v-else name="i-simple-icons-nuxtdotjs" class="size-5 text-primary mx-auto" /> -->
      <p v-if="!collapsed" class="font-semibold text-primary truncate">
        My Okane
      </p>

      <!-- This is the component used to toggle the sidebar's collapsed state -->
      <UDashboardSidebarCollapse class="ms-auto" />
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
        <template v-if="!collapsed" #trailing>
          <div class="flex items-center gap-0.5 ms-auto">
            <UKbd value="meta" variant="subtle" />
            <UKbd value="K" variant="subtle" />
          </div>
        </template>
      </UButton>

      <UNavigationMenu
        :collapsed="collapsed"
        :items="items[0]"
        orientation="vertical"
      />

      <UNavigationMenu
        :collapsed="collapsed"
        :items="items[1]"
        orientation="vertical"
        class="mt-auto"
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
            loading: 'lazy' as const,
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
