<script setup lang="ts">
import { ref } from 'vue'
import { DEALERS } from './dealers'
import TemplateField from './TemplateField.vue'

const template = ref('{{ dealer.name }} - 0% APR')
const dealerId = ref(DEALERS[0].id)
</script>

<template>
  <div class="ds-page-head">
    <h1>Ad copy</h1>
    <p class="ds-muted">Ad headlines may use placeholders. The 30 character limit applies after they are filled in, for every dealer.</p>
  </div>
  <TemplateField v-model="template" v-model:dealer-id="dealerId" :dealers="DEALERS" />
</template>
