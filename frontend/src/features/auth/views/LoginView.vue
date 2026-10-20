<script setup lang="ts">
import { ref } from 'vue'
import { LogIn, Zap } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { DsButton, DsCard, DsInput, DsMessage, DsPasswordInput } from '@/design-system'
import { useAsyncAction } from '@/shared/composables/useAsyncAction'
import { safeRedirect } from '@/shared/utils/safeRedirect'
import { useAuthStore } from '../store'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const demo = import.meta.env.DEV

const { run, pending, error } = useAsyncAction(async () => {
  await auth.login(email.value, password.value)
  await router.push(safeRedirect(route.query.redirect))
})
</script>

<template>
  <main class="login">
    <DsCard as="section" aria-labelledby="login-title" class="login-card">
      <div class="ds-stack">
        <div class="ds-stack" style="gap: var(--ds-space-2)">
          <div class="logo"><Zap aria-hidden="true" :size="22" /> Stream</div>
          <h1 id="login-title">Sign in</h1>
          <p class="ds-muted">Campaign operations for Google Ads and Meta. Every change is reviewed, approved and recorded.</p>
        </div>
        <form class="ds-stack" @submit.prevent="run()">
          <DsInput v-model="email" label="Email" type="email" autocomplete="username" required />
          <DsPasswordInput v-model="password" label="Password" autocomplete="current-password" required />
          <DsMessage v-if="error" tone="danger">{{ error.message }}</DsMessage>
          <DsButton type="submit" :icon="LogIn" :loading="pending" size="lg">Sign in</DsButton>
        </form>
        <p v-if="demo" class="demo ds-muted">Demo: strategist@, approver@ or admin@example.com / password</p>
      </div>
    </DsCard>
  </main>
</template>

<style scoped>
.login {
  display: grid;
  min-height: 100vh;
  padding: var(--ds-space-6);
  place-items: center;
  background:
    radial-gradient(circle at 15% 10%, var(--ds-color-tone-info-bg), transparent 55%),
    radial-gradient(circle at 90% 95%, var(--ds-color-bg-selected), transparent 50%), var(--ds-color-bg-canvas);
}
.login-card {
  width: min(26.5rem, 100%);
  box-shadow: var(--ds-shadow-md);
}
.logo {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-brand-mark);
}
.demo {
  font-size: var(--ds-font-size-xs);
  text-align: center;
}
</style>
