<script setup lang="ts">
import type { AnswerEntry } from '#shared/survey-catalog'

type ResponseDetail = {
  id: string
  createdAt: string
  version: 'v1' | 'v2'
  onWaitlist: boolean | null
  tracked: boolean
  entries: AnswerEntry[]
}

const props = defineProps<{ responseId: string | null }>()
const emit = defineEmits<{ close: [] }>()

const open = computed({
  get: () => Boolean(props.responseId),
  set: (value) => {
    if (!value) {
      emit('close')
    }
  }
})

const detail = shallowRef<ResponseDetail | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' })

async function load(id: string) {
  loading.value = true
  error.value = null
  detail.value = null

  try {
    const result = await $fetch<ResponseDetail>(`/api/admin/responses/${id}`)

    if (props.responseId === id) {
      detail.value = result
    }
  } catch (failure) {
    const status = (failure as { statusCode?: number }).statusCode
    error.value = status === 404 ? 'This response no longer exists.' : 'Couldn\'t load this response.'
  } finally {
    loading.value = false
  }
}

watch(() => props.responseId, (id) => {
  if (id) {
    load(id)
  }
}, { immediate: true })

const waitlistLabel = computed(() => {
  if (!detail.value || detail.value.onWaitlist === null) {
    return 'Unknown'
  }

  return detail.value.onWaitlist ? 'On the waitlist' : 'Not on the waitlist'
})
</script>

<template>
  <USlideover
    v-model:open="open"
    title="Survey response"
    :description="detail ? `Submitted ${dateFormat.format(new Date(detail.createdAt))} (Lagos time)` : 'Loading…'"
    :ui="{ content: 'max-w-xl', body: 'sm:p-6' }"
  >
    <template #body>
      <div
        v-if="loading"
        class="flex flex-col gap-4"
      >
        <USkeleton
          v-for="index in 6"
          :key="index"
          class="h-12"
        />
      </div>

      <p
        v-else-if="error"
        class="text-sm text-sand-700"
        role="alert"
      >
        {{ error }}
      </p>

      <div
        v-else-if="detail"
        class="flex flex-col gap-6"
      >
        <div class="flex flex-wrap gap-2">
          <UBadge
            :label="detail.version === 'v1' ? 'Survey v1 (8 questions)' : 'Survey v2 (current)'"
            color="neutral"
            variant="subtle"
          />
          <UBadge
            :label="`Waitlist: ${waitlistLabel}`"
            color="neutral"
            variant="outline"
            :title="detail.onWaitlist === null ? 'Saved before waitlist linking was tracked, and no matching email was found.' : undefined"
          />
        </div>

        <dl class="flex flex-col divide-y divide-sand-100">
          <div
            v-for="entry in detail.entries"
            :key="entry.key"
            class="flex flex-col gap-1 py-3 first:pt-0"
          >
            <dt class="text-xs font-medium text-sand-600">
              {{ entry.title }}
              <span
                v-if="entry.legacy"
                class="ml-1 font-normal"
              >(older question)</span>
            </dt>
            <dd
              v-if="entry.value && entry.value.length > 1"
              class="text-sm/relaxed text-sand-950"
            >
              <ul class="list-disc pl-4">
                <li
                  v-for="item in entry.value"
                  :key="item"
                >
                  {{ item }}
                </li>
              </ul>
            </dd>
            <dd
              v-else-if="entry.value"
              class="text-sm/relaxed whitespace-pre-line text-sand-950"
            >
              {{ entry.value[0] }}
            </dd>
            <dd
              v-else
              class="text-sm text-sand-600 italic"
            >
              Not answered
            </dd>
          </div>
        </dl>

        <p class="text-xs text-sand-600">
          Response ID <code class="font-mono">{{ detail.id }}</code>
        </p>
      </div>
    </template>
  </USlideover>
</template>
