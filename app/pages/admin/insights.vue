<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Response insights' })
</script>

<template>
  <AdminPage
    title="Response Insights"
    :filters="false"
  >
    <AdminComingSoon
      phase="Phase 3"
      title="AI theme analysis isn't built yet"
      body="Phase 3 groups the open-ended answers (burning questions, what people have tried, their one result, past purchases) into themes. Every theme will link to the exact responses behind it, AI suggestions will be labelled as such, and no emails or names are sent to an AI provider. No themes are shown until that analysis has actually run."
    />
  </AdminPage>
</template>
