export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch } = useUserSession()

  if (!loggedIn.value) {
    await fetch()
  }

  const isAdmin = loggedIn.value && user.value?.role === 'admin'

  if (to.path === '/admin/login') {
    return isAdmin ? navigateTo('/admin') : undefined
  }

  if (!isAdmin) {
    return navigateTo({ path: '/admin/login', query: to.fullPath !== '/admin' ? { next: to.fullPath } : undefined })
  }
})
