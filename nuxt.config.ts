const isCloudflareBuild = Boolean(process.env.CF_PAGES) || Boolean(process.env.NITRO_PRESET?.startsWith('cloudflare'))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/fonts',
    '@vueuse/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // The palette is hand-built per section; cream is the default surface.
  colorMode: {
    preference: 'light',
    fallback: 'light'
  },

  runtimeConfig: {
    databaseUrl: '',
    emailProvider: '',
    emailApiKey: '',
    emailAudienceId: '',
    emailFrom: '',
    public: {
      siteUrl: 'http://localhost:3000',
      // Unset until real accounts exist; empty values are hidden from the UI.
      instagramUrl: '',
      tiktokUrl: '',
      twitterUrl: '',
      contactEmail: '',
      analyticsId: ''
    }
  },

  routeRules: {
    '/': { prerender: true },
    '/privacy': { prerender: true },
    // The survey runs entirely in the browser, so nothing needs rendering per request.
    '/survey': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    prerender: {
      // Cloudflare serves `survey.html` at /survey; `survey/index.html` would redirect to /survey/.
      // The Node server only looks for `index.html`, so keep folders for every other target.
      autoSubfolderIndex: !isCloudflareBuild
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  fonts: {
    families: [
      { name: 'Barlow Condensed', provider: 'google', weights: [500, 600, 700, 800] },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600] }
    ]
  }
})
