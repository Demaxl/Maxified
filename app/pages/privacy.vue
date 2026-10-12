<script setup lang="ts">
const { brand } = useAppConfig()
const { analyticsId } = useRuntimeConfig().public
const { contact } = useSiteLinks()
const { data: emailSetup } = await useFetch('/api/email-setup')

useSeoMeta({
  title: 'Privacy Policy',
  description: `How ${brand.name} handles the information you share through the waitlist and the survey.`
})

/**
 * Written against what the code actually does today. The analytics and email sections
 * follow the configuration; if you change what gets collected or sent, update them too.
 */
const sections = computed(() => [
  {
    title: 'What I collect',
    body: [
      'If you join the waitlist, I store your email address. Your first name is optional — if you leave it blank, nothing is stored in its place.',
      'If you complete the survey, I store your answers. The survey itself never asks for your name or email.'
    ]
  },
  {
    title: 'When survey answers are linked to you',
    body: [
      'If you joined the waitlist from the same browser, your email is saved alongside your survey answers so I can follow up on what you told me. In that case your response is not anonymous.',
      'If you have not joined the waitlist, your answers are stored with no email attached.'
    ]
  },
  {
    title: 'Why I collect it',
    body: [
      'Your email is used to tell you when the guide is ready and to send your launch discount, plus the occasional short update on what I\'m building.',
      'Survey answers are used to decide what the guide should cover. Individual answers are never published or shared.'
    ]
  },
  {
    title: 'Where it is stored',
    body: [
      'Waitlist signups and survey responses are stored by the service that hosts this site, and are only accessible to me.',
      'This site also keeps two things in your own browser: a note that you have already joined the waitlist, so you are not asked twice, and a draft of your survey answers so a refresh does not lose your place. Both stay on your device and are removed if you clear your browser data.'
    ]
  },
  {
    title: 'Emails',
    body: emailSetup.value?.provider
      ? [
          `When you join the waitlist, your email address and first name (if you gave one) are shared with ${emailSetup.value.provider}, the email service this site uses, for the sole purpose of emailing you about this guide.`,
          emailSetup.value.welcomeEmail
            ? 'You get one welcome email straight away to confirm your signup. Reply to it and I\'ll remove you from the list. Every later email will also include a way to be removed.'
            : 'No emails are sent automatically when you sign up. When launch emails begin, every email will include a way to be removed from the list.'
        ]
      : ['No emails have been sent from this site yet, and it is not connected to an email delivery service. When launch emails do begin, your email address will be shared with the delivery provider for the sole purpose of sending them, and every email will include a way to unsubscribe.']
  },
  {
    title: 'Analytics',
    body: analyticsId
      ? ['This site uses privacy-friendly, aggregate analytics: page views and which buttons get used. No advertising trackers, no cookies for tracking, and no personal profiles.']
      : ['No analytics or tracking scripts are loaded on this site at the moment. No advertising trackers, no tracking cookies, and no personal profiles.']
  },
  {
    title: 'What I don\'t do',
    body: [
      'I don\'t sell, rent or trade your details.',
      'There are no accounts and no passwords, so there is nothing for you to manage or lose.'
    ]
  },
  {
    title: 'Removing your data',
    body: contact.value
      ? [`Email me at ${contact.value} and ask me to delete your waitlist entry or survey response, and I'll remove it.`]
      : ['You can ask me to delete your waitlist entry or survey response at any time. A contact address for these requests will be published here before the guide launches.']
  }
])
</script>

<template>
  <div class="min-h-svh bg-sand-100">
    <div class="shell max-w-3xl pt-28 pb-20 sm:pt-32">
      <SlashLabel :parts="[brand.name, 'Legal']" />
      <h1 class="mt-5 font-display text-headline font-bold text-balance text-sand-950 uppercase">
        Privacy Policy
      </h1>
      <p class="mt-6 text-base leading-relaxed text-sand-800 sm:text-lg">
        Short version: I collect the minimum I need to tell you when the guide is ready and to
        build something you'd actually find useful.
      </p>

      <div class="mt-12 border-t-2 border-sand-950">
        <section
          v-for="section in sections"
          :key="section.title"
          class="grid gap-3 border-b border-sand-950/15 py-7 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-8"
        >
          <h2 class="text-sm font-semibold text-sand-950">
            {{ section.title }}
          </h2>
          <div class="space-y-3">
            <p
              v-for="paragraph in section.body"
              :key="paragraph"
              class="text-base leading-relaxed text-sand-800"
            >
              {{ paragraph }}
            </p>
          </div>
        </section>
      </div>

      <p class="mt-10 text-sm leading-relaxed text-sand-700">
        I'm not a certified trainer, dietitian or medical professional. Everything on this site is
        educational and based on my own experience — not individualised medical or nutritional
        advice.
      </p>

      <AppButton
        to="/"
        variant="outline"
        class="mt-10"
      >
        Back to the site
      </AppButton>
    </div>
  </div>
</template>
