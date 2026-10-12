<script setup lang="ts">
const { photos } = useAppConfig()

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
      <div class="max-w-3xl">
        <SlashLabel :parts="['My Story', 'Then and Now']" />

        <h2 class="mt-5 font-display text-headline font-bold text-balance text-sand-950 uppercase">
          I started <span class="whitespace-nowrap">skinny-fat</span> and clueless.
        </h2>
      </div>

      <!-- Then: photos on the left, matching the hero pair. -->
      <article class="mt-12 grid gap-8 sm:mt-16 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-6">
        <header class="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:pt-2">
          <p class="flex items-center gap-3 text-label font-semibold text-sand-700 uppercase">
            <span class="bg-sand-950 px-2 py-1 text-sand-50">01</span>
            Then
          </p>
          <h3 class="mt-4 font-display text-title leading-none font-bold text-sand-950 uppercase">
            Where I started
          </h3>
        </header>

        <PhotoCarousel
          :slides="photos.gallery.then"
          label="Photos from when I started"
          :tag="{ text: 'Then', class: 'bg-sand-950 text-sand-50' }"
          class="reveal lg:col-span-6 lg:col-start-1 lg:row-span-2 lg:row-start-1"
        />

        <div class="min-w-0 lg:col-span-5 lg:col-start-8 lg:row-start-2">
          <p class="max-w-md text-base leading-relaxed text-sand-800 sm:text-lg">
            I copied workouts off the internet, ate whatever was around, and couldn't work out
            why nothing changed.
          </p>

          <h4 class="mt-8 font-display text-xl leading-none font-bold text-sand-950 uppercase">
            Sound familiar?
          </h4>
          <ul class="mt-3">
            <li
              v-for="problem in familiarProblems"
              :key="problem"
              class="flex items-baseline gap-3 border-b border-sand-950/12 py-3 text-base text-sand-800"
            >
              <span
                aria-hidden="true"
                class="font-display font-bold text-lime-800"
              >/</span>
              {{ problem }}
            </li>
          </ul>
          <p class="mt-4 text-sm text-sand-700">
            I've been through all four.
          </p>
        </div>
      </article>

      <div
        aria-hidden="true"
        class="my-12 flex items-center gap-4 text-label font-semibold text-sand-700 uppercase sm:my-16"
      >
        <span class="h-px flex-1 bg-sand-950/15" />
        <span class="flex items-center gap-2">
          Four years of training
          <UIcon
            name="i-lucide-arrow-down"
            class="size-4 text-lime-800"
          />
        </span>
        <span class="h-px flex-1 bg-sand-950/15" />
      </div>

      <!-- Now: photos on the right. -->
      <article class="grid gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-6">
        <header class="min-w-0 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:pt-2">
          <p class="flex items-center gap-3 text-label font-semibold text-sand-700 uppercase">
            <span class="bg-lime-400 px-2 py-1 text-sand-950">02</span>
            Now
          </p>
          <h3 class="mt-4 font-display text-title leading-none font-bold text-sand-950 uppercase">
            Where I am now
          </h3>
        </header>

        <PhotoCarousel
          :slides="photos.gallery.now"
          label="Photos of my current physique"
          :tag="{ text: 'Now', class: 'bg-lime-400 text-sand-950' }"
          class="reveal lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1"
        />

        <div class="min-w-0 lg:col-span-5 lg:col-start-1 lg:row-start-2">
          <p class="max-w-md text-base leading-relaxed text-sand-800 sm:text-lg">
            What changed it was slow: learning to train with a plan, eating with intent, and
            getting through bulks, cuts and plenty of wrong turns. The guide is the short version.
          </p>

          <p class="mt-6 max-w-md text-sm leading-relaxed text-sand-700">
            This is my own experience — individual results vary, and nothing here promises a
            specific outcome.
          </p>
        </div>
      </article>
    </div>
  </section>
</template>
