<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Pricing insights' })
</script>

<template>
  <AdminPage
    title="Pricing Insights"
    :filters="false"
  >
    <AdminComingSoon
      phase="Phase 2"
      title="Pricing analysis isn't built yet"
      body="Answers to “How much would you realistically pay?” are free text in any currency. Phase 2 adds a parser that reads amounts and currencies, flags ambiguous answers for review instead of guessing, and never mixes currencies without a recorded exchange rate. Until then, the raw answers are on each response under All Responses."
    />
  </AdminPage>
</template>
