<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useTheme } from '@/design-system'
import { useAuthStore } from '@/features/auth/store'
import EmergencyBanner from '@/features/system/components/EmergencyBanner.vue'
import { useSystemStore } from '@/features/system/store'
import { useAsyncAction } from '@/shared/composables/useAsyncAction'
import { usePolling } from '@/shared/composables/usePolling'
import { useBack } from '@/shared/composables/useBack'
import { useBreadcrumbs } from '@/shared/composables/useBreadcrumbs'
import AppHeader from './layouts/AppHeader.vue'
import PageNav from './layouts/PageNav.vue'

const auth = useAuthStore()
const system = useSystemStore()
const router = useRouter()
const { dark, toggle: toggleTheme } = useTheme()
const crumbs = useBreadcrumbs()
const { canGoBack, back } = useBack()

const setStop = useAsyncAction((next: boolean) => system.setEmergencyStop(next))
const polling = usePolling(() => system.load(), 30_000)

watch(
  () => auth.user,
  (user) => {
    if (user) {
      void system.load()
      polling.start()
    } else {
      polling.stop()
    }
  },
  { immediate: true },
)

const canStop = computed(() => auth.can('admin'))

const focusMain = () => document.getElementById('main')?.focus()

// The banner's Resume button disappears when the state flips, so move focus somewhere sensible (WCAG 2.4.3).
async function resumeWrites(): Promise<void> {
  await setStop.run(false)
  await nextTick()
  focusMain()
}

async function logout(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <a v-if="auth.user" href="#main" class="ds-skip-link" @click.prevent="focusMain">Skip to main content</a>
  <EmergencyBanner v-if="auth.user && system.emergencyStop" :can-resume="canStop" :busy="setStop.pending.value" @resume="resumeWrites" />
  <AppHeader v-if="auth.user" :user="auth.user" :dark="dark" @logout="logout" @toggle-theme="toggleTheme" />
  <main id="main" tabindex="-1" :class="{ 'ds-main': auth.user }">
    <PageNav v-if="auth.user" :crumbs="crumbs" :can-go-back="canGoBack" @back="back" @navigate="router.push($event.href)" />
    <RouterView />
  </main>
</template>
