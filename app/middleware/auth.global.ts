export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  const publicPages = ['/login', '/register', '/forgot-password', '/reset-password']
  const normalizedPath = to.path.replace(/\/+$/, '') || '/'
  const isPublic = publicPages.includes(normalizedPath)

  if (!loggedIn.value && !isPublic) {
    return navigateTo('/login')
  }

  if (loggedIn.value && isPublic) {
    return navigateTo('/')
  }
})
