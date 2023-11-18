import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import legacy from '@vitejs/plugin-legacy'

import { resolve } from 'path'

const root = resolve(__dirname, 'va-hakija/web/va/')

const hakijaPaths = {
  hakemus: '/index.html',
  muutoshakemus: '/muutoshakemus.html',
  selvitys: '/selvitys.html',
  kirjautuminen: '/login.html',
} as const

const getHtmlFilePath = (url?: string) => {
  if (!url) {
    return
  }
  if (url === '/' || url.startsWith('/avustushaku') || url.startsWith('/statsunderstod/')) {
    return hakijaPaths.hakemus
  }
  if (url.match(/\/avustushaku\/\d*\/nayta/)) {
    return hakijaPaths.hakemus
  }
  if (url === '/muutoshakemus' || url === '/muutoshakemus/paatos') {
    return hakijaPaths.muutoshakemus
  }
  if (url.match(/\/avustushaku\/\d*\/(loppu|vali)selvitys/)) {
    return hakijaPaths.selvitys
  }
  if (url.match(/\/avustushaku\/\d*\//)) {
    return hakijaPaths.kirjautuminen
  }
  return
}

const serverPath = 'http://localhost:8080'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'serve' ? undefined : '/hakija/'
  return {
    base,
    plugins: [
      react(),
      tsconfigPaths(),
      {
        name: 'dev-rewrite-middleware',
        configureServer(serve) {
          serve.middlewares.use((req, _res, next) => {
            req.url = getHtmlFilePath(req.url) ?? req.url
            next()
          })
        },
      },
      legacy({
        targets: ['defaults', 'not IE 11'],
      }),
    ],
    server: {
      proxy: {
        '/api/': {
          target: serverPath,
        },
        '/environment': {
          target: serverPath,
        },
        '/img': {
          target: serverPath,
        },
        '/favicon.ico': {
          target: serverPath,
        },
      },
    },
    resolve: {
      alias: [
        { find: /^~/, replacement: '' },
        {
          find: /\/soresu-form/,
          replacement: resolve(__dirname, '/soresu-form'),
        },
      ],
    },
    build: {
      sourcemap: 'hidden',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          hakijaApp: resolve(root, hakijaPaths.hakemus),
          selvitysApp: resolve(root, hakijaPaths.selvitys),
          hakijaLogin: resolve(root, hakijaPaths.kirjautuminen),
          muutoshakemusApp: resolve(root, hakijaPaths.muutoshakemus),
        },
        output: {
          dir: resolve(__dirname, 'server/resources/public/' + base),
        },
      },
    },
  }
})
