<script setup lang="ts">
import { computed } from 'vue'
import { DsTag } from '@/design-system'

const props = defineProps<{ status: string }>()

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

// One place that decides what each domain status looks like. Amber = needs attention, red = stopped, green = done.
const TONES: Record<string, Tone> = {
  applied: 'success',
  active: 'success',
  approved: 'info',
  applying: 'info',
  pending_approval: 'warning',
  paused: 'warning',
  partially_failed: 'warning',
  limited: 'warning',
  blocked: 'danger',
  failed: 'danger',
  rejected: 'danger',
  no_changes: 'neutral',
}

const tone = computed(() => TONES[props.status] ?? 'neutral')
const label = computed(() => props.status.replace(/_/g, ' '))
</script>

<template>
  <DsTag :tone="tone">{{ label }}</DsTag>
</template>
