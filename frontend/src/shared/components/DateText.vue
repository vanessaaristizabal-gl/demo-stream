<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, formatDateTime, formatDateTimeLong } from '@/shared/utils/format'

const props = withDefaults(defineProps<{ value: string | null | undefined; mode?: 'date' | 'datetime' }>(), { mode: 'date' })

const text = computed(() => (props.mode === 'datetime' ? formatDateTime(props.value) : formatDate(props.value)))
const valid = computed(() => text.value !== '—')
// The tooltip gives the full, time-zone-explicit moment for anyone who needs it.
const full = computed(() => formatDateTimeLong(props.value))
</script>

<template>
  <time v-if="valid" :datetime="value ?? undefined" :title="full">{{ text }}</time>
  <span v-else>—</span>
</template>
