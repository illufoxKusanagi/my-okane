<script setup lang="ts">
const colorMode = useColorMode();

const nextTheme = computed(() =>
  colorMode.value === "dark" ? "light" : "dark",
);

const switchTheme = () => {
  colorMode.preference = nextTheme.value;
};

const startViewTransition = (event: MouseEvent) => {
  if (!document.startViewTransition) {
    switchTheme();
    return;
  }

  document.startViewTransition(() => {
    switchTheme();
  });
};
</script>

<template>
  <ClientOnly>
    <UButton
      :aria-label="`Switch to ${nextTheme} mode`"
      :icon="`i-lucide-${nextTheme === 'dark' ? 'sun' : 'moon'}`"
      color="neutral"
      variant="ghost"
      size="sm"
      class="rounded-full"
      @click="startViewTransition"
    />
    <template #fallback>
      <div class="size-4" />
    </template>
  </ClientOnly>
</template>

<style>
:root {
  --theme-transition-duration: 1.31s;
}

::view-transition-group(root) {
  z-index: 9999;
}

::view-transition-new(root),
::view-transition-old(root) {
  animation: scale var(--theme-transition-duration) both;
}

::view-transition-new(root) {
  mask: url("/dark-mode.gif?v=3") center / 0 no-repeat;
  -webkit-mask: url("/dark-mode.gif?v=3") center / 0 no-repeat;
}

@keyframes scale {
  0% {
    mask-size: 0;
    -webkit-mask-size: 0;
  }
  10% {
    mask-size: 40vmax;
    -webkit-mask-size: 40vmax;
  }
  90% {
    mask-size: 40vmax;
    -webkit-mask-size: 40vmax;
  }
  100% {
    mask-size: 750vmax;
    -webkit-mask-size: 750vmax;
  }
}
</style>
