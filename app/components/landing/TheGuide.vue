<script setup lang="ts">
const chapters = [
  {
    word: 'Train',
    summary: 'How I structure training, and how to keep progressing past the beginner stage.',
    topics: ['Workout plans', 'Training splits', 'Progression', 'Recovery']
  },
  {
    word: 'Eat',
    summary: 'How I structure my nutrition especially for Nigerians.',
    topics: ['Calories and protein', 'Affordable meals', 'Bulking and Cutting', 'Supplements']
  },
  {
    word: 'Grow',
    summary: 'The habits that I have cultivated in the long game, and the mistakes I would skip entirely.',
    topics: ['Building muscle', 'Tracking progress', 'Staying consistent', 'Mistakes to avoid']
  }
]
</script>

<template>
  <section id="inside" class="border-t border-sand-950/12 bg-sand-100 py-16 sm:py-20 lg:py-28">
    <div class="shell">
      <div class="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-x-10">
        <div class="min-w-0 lg:col-span-6">
          <SlashLabel :parts="['Train', 'Eat', 'Grow']" />
          <h2 class="mt-5 font-display text-headline font-bold text-balance text-sand-950 uppercase">
            What's inside the guide.
          </h2>
        </div>

        <p class="max-w-md text-base leading-relaxed text-sand-800 sm:text-lg lg:col-span-5 lg:col-start-8">
          Three parts, written from what actually worked for me. I'm still putting together the contents, and survey
          answers decide what gets the most attention.
        </p>
      </div>
      <ol class="mt-12 grid gap-12 sm:mt-16 md:grid-cols-3 md:gap-8 lg:gap-10">
        <li v-for="(chapter, index) in chapters" :key="chapter.word"
          class="reveal min-w-0 border-t-2 border-sand-950 pt-5">
          <p class="text-label font-semibold text-sand-700 uppercase tabular-nums">
            Part 0{{ index + 1 }}
          </p>
          <h3 class="mt-3 text-heading font-semibold text-sand-950">
            {{ chapter.word }}
          </h3>
          <p class="mt-3 text-base leading-relaxed text-sand-800">
            {{ chapter.summary }}
          </p>

          <ul class="mt-5 grid grid-cols-2 gap-x-5 md:mt-6 md:grid-cols-1 md:border-t md:border-sand-950/15">
            <li v-for="topic in chapter.topics" :key="topic"
              class="border-b border-sand-950/15 py-3 text-[0.9375rem] text-sand-950">
              {{ topic }}
            </li>
          </ul>
        </li>
      </ol>
    </div>
  </section>
</template>
