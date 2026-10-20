<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import DsButton from './DsButton.vue'
import DsInput from './DsInput.vue'

defineProps<{ label: string; autocomplete?: string; required?: boolean; error?: string; hint?: string }>()
const model = defineModel<string>({ default: '' })
const visible = ref(false)
// A plain input plus a labelled toggle: simpler and more valid than widget ARIA on the <input>.
</script>

<template>
  <DsInput
    v-model="model"
    :label="label"
    :type="visible ? 'text' : 'password'"
    :autocomplete="autocomplete"
    :required="required"
    :error="error"
    :hint="hint"
  >
    <template #suffix>
      <DsButton
        variant="ghost"
        size="sm"
        :icon="visible ? EyeOff : Eye"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        :aria-pressed="visible"
        @click="visible = !visible"
      />
    </template>
  </DsInput>
</template>
