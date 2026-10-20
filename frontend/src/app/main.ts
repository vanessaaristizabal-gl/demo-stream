import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/inter'
import '@/design-system/tokens/tokens.css'
import '@/design-system/base.css'
import { useAuthStore } from '@/features/auth/store'
import { configureApi } from '@/shared/api/client'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)
app.use(createPinia())

const auth = useAuthStore()
configureApi({
  getToken: () => auth.token,
  onUnauthorized: () => {
    auth.clear()
    void router.push({ name: 'login' })
  },
})

app.use(router)
app.mount('#app')
