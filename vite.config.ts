import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(() => {
  const isElectron = process.env.APP_TARGET === 'electron'

  return {
    plugins: [
      vue(),
      ...(isElectron
        ? [
            electron({
              main: {
                entry: 'electron/main.ts',
              },
              preload: {
                input: path.join(__dirname, 'electron/preload.ts'),
              },
              renderer:
                process.env.NODE_ENV === 'test'
                  ? undefined
                  : {},
            }),
          ]
        : []),
    ],
  }
})
