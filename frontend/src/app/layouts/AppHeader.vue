<script setup lang="ts">
import { Beaker, FlaskConical, History, ListChecks, LogOut, Megaphone, Moon, Sun, Zap } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { DsButton } from '@/design-system'
import type { User } from '@/shared/api/types'
import EmergencyStopButton from '@/features/system/components/EmergencyStopButton.vue'

defineProps<{ user: User; dark: boolean; stopActive: boolean; canStop?: boolean; stopBusy?: boolean; stopError?: string | null }>()
const emit = defineEmits<{ logout: []; toggleTheme: []; engageStop: [] }>()

const LINKS = [
  { name: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { name: 'approvals', label: 'Approvals', icon: ListChecks },
  { name: 'changelog', label: 'Changelog', icon: History },
  { name: 'sandbox', label: 'Sandbox', icon: FlaskConical },
  ...(import.meta.env.DEV ? [{ name: 'lab', label: 'Lab', icon: Beaker }] : []),
]
</script>

<template>
  <header class="header">
    <div class="brand"><Zap aria-hidden="true" :size="20" /> Stream</div>
    <nav class="nav" aria-label="Main">
      <RouterLink v-for="l in LINKS" :key="l.name" :to="{ name: l.name }" class="nav-link">
        <component :is="l.icon" aria-hidden="true" :size="18" />
        <span>{{ l.label }}</span>
      </RouterLink>
    </nav>
    <div class="actions">
      <EmergencyStopButton v-if="canStop && !stopActive" :busy="stopBusy" :error="stopError" @engage="emit('engageStop')" />
      <span class="who hide-sm">
        <strong>{{ user.name }}</strong> <span class="ds-muted">{{ user.role }}</span>
      </span>
      <DsButton
        variant="secondary"
        :icon="dark ? Sun : Moon"
        :aria-label="dark ? 'Switch to light theme' : 'Switch to dark theme'"
        @click="emit('toggleTheme')"
      />
      <DsButton variant="secondary" :icon="LogOut" aria-label="Sign out" @click="emit('logout')"
        ><span class="hide-sm">Sign out</span></DsButton
      >
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--ds-z-header);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-4);
  padding: var(--ds-space-3) var(--ds-space-6);
  background: var(--ds-color-bg-surface);
  border-bottom: var(--ds-border-width-thin) solid var(--ds-color-border-default);
}
.brand {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-bold);
  color: var(--ds-color-brand-mark);
}
.nav {
  display: flex;
  gap: var(--ds-space-1);
}
.nav-link {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-height: var(--ds-size-control-md);
  padding: 0 var(--ds-space-3);
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-text-muted);
  font-weight: var(--ds-font-weight-medium);
  text-decoration: none;
}
.nav-link:hover {
  background: var(--ds-color-bg-hover);
  color: var(--ds-color-text-default);
}
.nav-link.router-link-active {
  box-shadow: inset 0 -2px 0 var(--ds-color-text-link); /* an indicator besides color (WCAG 1.4.1) */
  background: var(--ds-color-bg-selected);
  color: var(--ds-color-text-link);
}
.actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  margin-left: auto;
}
.who {
  display: grid;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-font-line-height-tight);
  text-align: right;
}

/* Phones: brand and actions on the first row, navigation on its own scrollable row. */
@media (max-width: 45rem) {
  .header {
    gap: var(--ds-space-2);
    padding: var(--ds-space-2) var(--ds-space-4);
  }
  .actions {
    gap: var(--ds-space-2);
  }
  .nav {
    order: 3;
    flex: 0 0 100%;
    min-width: 0;
    overflow-x: auto;
  }
  .nav-link {
    white-space: nowrap;
  }
  .hide-sm {
    display: none;
  }
}
</style>
