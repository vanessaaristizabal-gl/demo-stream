<script setup lang="ts">
import { computed, ref } from 'vue'
import { DsInput } from '@/design-system'

const copy = ref('<b>{{ dealer.name }}</b> - 0% APR')
const preview = computed(() => copy.value.replace('{{ dealer.name }}', 'Acme Motors'))
</script>

<template>
  <DsInput v-model="copy" label="Ad copy" :error="preview.length > 30 ? 'Too long' : undefined" />
  <h2>Preview</h2>
  <p v-html="preview" />
</template>
