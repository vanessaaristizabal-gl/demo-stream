import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/shared/api/client'
import type { Rulebook } from '@/shared/api/types'

export const useSystemStore = defineStore('system', () => {
  const emergencyStop = ref(false)

  async function load(): Promise<void> {
    emergencyStop.value = (await api<{ active: boolean }>('/emergency-stop')).active
  }

  async function setEmergencyStop(active: boolean): Promise<void> {
    emergencyStop.value = (await api<{ active: boolean }>('/emergency-stop', { method: 'POST', body: { active } })).active
  }

  const rulebooks = ref<Rulebook[]>([])
  async function fetchRulebooks(): Promise<void> {
    rulebooks.value = await api<Rulebook[]>('/rulebooks')
  }

  return { emergencyStop, load, setEmergencyStop, rulebooks, fetchRulebooks }
})
