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
    '/privacy': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

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
