<template>
  <div>
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-[3px] focus:bg-lime-400 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-sand-950"
    >
      Skip to content
    </a>

    <SiteHeader />

    <main id="main">
      <slot />
    </main>

    <SiteFooter />
  </div>
</template>
