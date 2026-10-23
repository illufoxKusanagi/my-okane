<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

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

  // Set cache-busting timestamp on root so the animated GIF mask replays from frame 0
  document.documentElement.style.setProperty(
    '--theme-mask-image',
    `url('/dark-mode.gif?t=${Date.now()}')`
  )

  try {
    const transition = document.startViewTransition(async () => {
      switchTheme()
      await nextTick()
    })
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
  --theme-transition-duration: 6.83s;
}

::view-transition-group(root) {
  z-index: 9999;
}

::view-transition-old(root) {
  animation: none;
  mix-blend-mode: normal;
  z-index: 1;
}

::view-transition-new(root) {
  animation: scale var(--theme-transition-duration) both;
  mix-blend-mode: normal;
  z-index: 9999;
  mask: var(--theme-mask-image, url("/dark-mode.gif?v=3")) center / 0 no-repeat;
  -webkit-mask: var(--theme-mask-image, url("/dark-mode.gif?v=3")) center / 0 no-repeat;
}

@keyframes scale {
  0% {
    mask-size: 100vmax;
    -webkit-mask-size: 100vmax;
  }
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
