<script setup lang="ts">
import { ref, computed } from 'vue'

const colorMode = useColorMode()
const isTransitioning = ref(false)

const nextTheme = computed(() =>
  colorMode.value === 'dark' ? 'light' : 'dark'
)

const switchTheme = () => {
  colorMode.preference = nextTheme.value
}

const startViewTransition = async () => {
  if (isTransitioning.value) return

  if (!document.startViewTransition) {
    switchTheme()
    return
  }

  isTransitioning.value = true

  try {
    const transition = document.startViewTransition(() => {
      switchTheme()
    })
    // Wait for native browser view transition animations to finish playing
    await transition.finished
  } catch (error) {
    console.error('View transition failed:', error)
  } finally {
    isTransitioning.value = false
  }
}
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
      :disabled="isTransitioning"
      @click="startViewTransition"
    />
    <template #fallback>
      <div class="size-4" />
    </template>
  </ClientOnly>
</template>

<style>
:root {
  --theme-transition-duration: 0.4s;
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
    mask-size: 100vmax;
    -webkit-mask-size: 100vmax;
  }
  /* 10% {
    mask-size: 80vmax;
    -webkit-mask-size: 80vmax;
  } */
  95% {
    mask-size: 100vmax;
    -webkit-mask-size: 100vmax;
  }
  100% {
    mask-size: 10000vmax;
    -webkit-mask-size: 10000vmax;
  }
}
</style>
