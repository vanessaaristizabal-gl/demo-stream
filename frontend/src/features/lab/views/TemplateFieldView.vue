<script setup lang="ts">
import { ref } from 'vue'
import TemplateField from '../components/TemplateField.vue'
import { DEALERS } from '../dealers'

const template = ref('{{ dealer.name }} - 0% APR')
const dealerId = ref(DEALERS[0].id)
</script>

<template>
  <div class="ds-page-head">
    <h1>Template field</h1>
    <p class="ds-muted">Ad headlines may use placeholders. The 30 character limit applies after they are filled in.</p>
  </div>
  <TemplateField v-model="template" v-model:dealer-id="dealerId" :dealers="DEALERS" />
</template>
