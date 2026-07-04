export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();

  const publicPages = ["/login", "/register"];
  const isPublic = publicPages.includes(to.path);

  if (!loggedIn.value && !isPublic) {
    return navigateTo("/login");
  }

  if (loggedIn.value && isPublic) {
    return navigateTo("/");
  }
});
