<script setup lang="ts">
definePageMeta({ layout: false, middleware: 'admin' })
useHead({ title: 'Sign in', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const route = useRoute()
const { fetch: refreshSession } = useUserSession()

const password = ref('')
const error = ref('')
const submitting = ref(false)

/** Only same-site dashboard paths, so the redirect can't be pointed elsewhere. */
function nextPath() {
  const next = typeof route.query.next === 'string' ? route.query.next : ''
  return next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin'
}

async function signIn() {
  if (submitting.value) {
    return
  }

  error.value = ''

  if (!password.value) {
    error.value = 'Please enter the password.'
    return
  }

  submitting.value = true

  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    await refreshSession()
    await navigateTo(nextPath())
  } catch (failure) {
    const data = (failure as { data?: { data?: { message?: string } } }).data?.data
    error.value = data?.message ?? 'Couldn\'t sign in. Please try again.'
    password.value = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="flex min-h-svh items-center justify-center bg-sand-100 px-5 py-12">
    <div class="w-full max-w-sm rounded-xl border border-sand-200 bg-white p-6 shadow-xs sm:p-8">
      <BrandLogo class="h-5" />
      <h1 class="mt-6 text-xl font-semibold tracking-tight text-sand-950">
        Survey insights
      </h1>
      <p class="mt-1 text-sm text-sand-600">
        Admin access only.
      </p>

      <form
        class="mt-6 flex flex-col gap-4"
        novalidate
        @submit.prevent="signIn"
      >
        <UFormField
          label="Password"
          name="password"
          :error="error || undefined"
        >
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            autofocus
            class="w-full"
            size="lg"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Sign in"
          color="neutral"
          size="lg"
          block
          :loading="submitting"
        />
      </form>
    </div>
  </main>
</template>
