<script setup lang="ts">
const props = withDefaults(defineProps<{
  to?: string
  href?: string
  type?: 'button' | 'submit'
  /**
   * `solid` is the lime primary and the only lime fill on the page. `ink` is a
   * near-black secondary for cream. `outline`/`outlineCream` are quieter still;
   * pick the variant that matches the surface behind it.
   */
  variant?: 'solid' | 'ink' | 'outline' | 'outlineCream'
  size?: 'md' | 'lg'
  block?: boolean
  loading?: boolean
  disabled?: boolean
}>(), {
  type: 'button',
  variant: 'solid',
  size: 'md',
  block: false,
  loading: false,
  disabled: false
})

const variants = {
  solid: 'bg-lime-400 text-sand-950 hover:bg-lime-300',
  ink: 'bg-sand-950 text-sand-50 hover:bg-sand-800',
  outline: 'border border-sand-950/30 text-sand-950 hover:border-sand-950',
  outlineCream: 'border border-sand-100/35 text-sand-50 hover:border-sand-50'
}

const sizes = {
  md: 'h-11 px-5 text-[0.9375rem]',
  lg: 'h-13 px-7 text-base'
}

const component = computed(() => {
  if (props.to) {
    return resolveComponent('NuxtLink')
  }

  return props.href ? 'a' : 'button'
})

const isInert = computed(() => props.disabled || props.loading)
</script>

<template>
  <component
    :is="component"
    :to="to"
    :href="href"
    :type="to || href ? undefined : type"
    :disabled="to || href ? undefined : isInert"
    :aria-busy="loading || undefined"
    class="group relative inline-flex items-center justify-center gap-2.5 rounded-[3px] font-display font-semibold tracking-[0.06em] whitespace-nowrap uppercase transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-55"
    :class="[variants[variant], sizes[size], block ? 'w-full' : '']"
  >
    <UIcon
      v-if="loading"
      name="i-lucide-loader-circle"
      class="size-4 animate-spin"
    />
    <slot />
    <span
      v-if="!loading"
      class="transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
    >
      <slot name="trailing" />
    </span>
  </component>
</template>
