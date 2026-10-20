<script setup lang="ts">
import type { LabPreview } from '@/shared/api/types'

defineProps<{ preview: LabPreview; error: string | null; failed: { id: number; message: string }[] }>()
defineEmits<{ approve: [] }>()
</script>

<template>
  <section class="bulk">
    <h2>Budget changes</h2>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="failed.length" role="status">{{ failed.length }} failed</p>
    <table>
      <tr v-for="item in preview.items" :key="item.id">
        <td>{{ item.account }}</td>
        <td>{{ item.before }} to {{ item.after }}</td>
      </tr>
    </table>
    <button class="approve" @click="$emit('approve')">Approve</button>
  </section>
</template>

<style scoped>
.bulk {
  padding: 18px;
  margin-top: 14px;
  background: #f4f6fa;
  color: #1a2233;
}
.approve {
  background: #2f6fed;
  color: white;
  padding: 7px 13px;
  border-radius: 5px;
}
td {
  padding: 3px 9px;
  border-bottom: 1px solid rgb(200, 205, 215);
}
</style>
