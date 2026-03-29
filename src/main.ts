import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'element-plus/dist/index.css'

createApp(App).mount('#app').$nextTick(() => {
  if (
    window.ipcRenderer &&
    typeof window.ipcRenderer.on === 'function'
  ) {
    window.ipcRenderer.on('main-process-message', (_event, message) => {
      console.log(message)
    })
  }
})
