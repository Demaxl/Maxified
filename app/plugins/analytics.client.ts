export default defineNuxtPlugin(() => {
  const { analyticsId } = useRuntimeConfig().public

  if (!analyticsId) {
    return
  }

  useHead({
    script: [
      {
        'src': 'https://plausible.io/js/script.js',
        'defer': true,
        'data-domain': analyticsId
      }
    ]
  })
})
