<script setup lang="ts">
import { surveyStepCount } from '#shared/survey'

const { track } = useAnalytics()
</script>

<template>
  <section
    id="survey"
    class="bg-sand-100 py-14 sm:py-16"
  >
    <div class="shell grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-x-10">
      <h2 class="text-heading font-semibold text-sand-950 lg:col-span-5">
        Help shape MAXIFIED.
      </h2>

      <div class="min-w-0 lg:col-span-6 lg:col-start-7">
        <p class="max-w-lg text-base leading-relaxed text-sand-800">
          I'm building this around real fitness struggles, not assumptions. Tell me what you're
          working towards and what you wish you understood better.
        </p>

        <AppButton
          to="/survey"
          variant="outline"
          class="mt-6"
          @click="track('survey_start', { from: 'community_section' })"
        >
          Take the {{ surveyStepCount }}-question survey
          <template #trailing>
            <UIcon
              name="i-lucide-arrow-right"
              class="size-4"
            />
          </template>
        </AppButton>

        <p class="mt-5 max-w-lg text-sm leading-relaxed text-sand-700">
          No email needed. If you've joined the waitlist in this browser, your email is saved with
          your answers so I can follow up, so the response isn't anonymous.
          <NuxtLink
            to="/privacy"
            class="rounded-[2px] text-sand-950 underline decoration-sand-400 underline-offset-2 transition-colors hover:decoration-sand-950"
          >
            Privacy policy
          </NuxtLink>
        </p>
      </div>
    </div>
  </section>
</template>
