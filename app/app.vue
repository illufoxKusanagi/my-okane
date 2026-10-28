<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() =>
  colorMode.value === 'dark' ? '#1b1718' : 'white'
)

useHead({
  titleTemplate: (titleChunk?: string) =>
    titleChunk ? `${titleChunk} - My Okane` : 'My Okane',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '192x192',
      href: '/pwa-192x192.png'
    },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

if (import.meta.dev && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.unregister()
    }
  })
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name)
      }
    })
  }
}
</script>

<template>
  <UApp :toaster="{ position: 'top-center' }">
    <NuxtPwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
