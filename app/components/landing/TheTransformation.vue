<script setup lang="ts">
const familiarProblems = [
  'Copying random workouts off the internet',
  'No idea how much to eat, or of what',
  'Conflicting advice from every direction',
  'Training for months without seeing a change'
]
</script>

<template>
  <section
    id="story"
    class="border-t border-sand-950/12 bg-sand-100 py-16 sm:py-20 lg:py-28"
  >
    <div class="shell">
      <div class="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
        <div class="min-w-0 lg:col-span-5 lg:pt-2">
          <SlashLabel :parts="['My Story', 'Where I Am Now']" />

          <h2 class="mt-5 font-display text-headline font-bold text-balance text-sand-950 uppercase">
            I started <span class="whitespace-nowrap">skinny-fat</span> and clueless.
          </h2>

          <div class="mt-7 max-w-md space-y-4 text-base leading-relaxed text-sand-800 sm:text-lg">
            <p>
              I copied workouts off the internet, ate whatever was around, and couldn't work out
              why nothing changed.
            </p>
            <p>
              What changed it was slow: learning to train with a plan, eating with intent, and
              getting through bulks, cuts and plenty of wrong turns. The guide is the short version.
            </p>
          </div>
        </div>

        <PhysiqueCarousel class="reveal lg:col-span-6 lg:col-start-7" />
      </div>

      <div class="mt-14 border-t border-sand-950/15 pt-8 sm:mt-20 lg:grid lg:grid-cols-12 lg:gap-x-10">
        <h3 class="font-display text-2xl leading-none font-bold text-sand-950 uppercase lg:col-span-5">
          Sound familiar?
        </h3>

        <div class="mt-5 min-w-0 lg:col-span-7 lg:mt-0">
          <ul class="grid sm:grid-cols-2 sm:gap-x-10">
            <li
              v-for="problem in familiarProblems"
              :key="problem"
              class="flex items-baseline gap-3 border-b border-sand-950/12 py-3.5 text-base text-sand-800"
            >
              <span
                aria-hidden="true"
                class="font-display font-bold text-lime-800"
              >/</span>
              {{ problem }}
            </li>
          </ul>

          <p class="mt-6 max-w-xl text-sm leading-relaxed text-sand-700">
            I've been through all four. This is my own experience — individual results vary, and
            nothing here promises a specific outcome.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
