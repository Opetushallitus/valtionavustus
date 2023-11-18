import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

import { resolve } from 'path'

const root = resolve(__dirname)

const virkailijaPaths = {
  hakemustenArviointi: '/index.html',
  hakujenHallinta: '/admin.html',
  koodienHallinta: '/codevalues.html',
  haku: '/search.html',
  yhteenveto: '/summary.html',
  kirjautuminen: '/login.html',
} as const

const getHtmlFilePath = (url?: string) => {
  if (!url) {
    return
  }
  if (url === '/' || url.startsWith('/avustushaku')) {
    return virkailijaPaths.hakemustenArviointi
  }
  if (url.startsWith('/admin-ui/va-code-values')) {
    return virkailijaPaths.koodienHallinta
  }
  if (url.startsWith('/admin/')) {
    return virkailijaPaths.hakujenHallinta
  }
  if (url.startsWith('/yhteenveto')) {
    return virkailijaPaths.yhteenveto
  }
  if (url.startsWith('/haku/')) {
    return virkailijaPaths.haku
  }
  return
}

const serverPath = 'http://localhost:8081'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'serve' ? undefined : '/virkailija/'
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
    ],
    server: {
      port: 5173,
      strictPort: true,
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
          app: root + virkailijaPaths.hakemustenArviointi,
          adminApp: resolve(root, virkailijaPaths.hakujenHallinta),
          login: resolve(root, virkailijaPaths.kirjautuminen),
          codeValues: resolve(root, virkailijaPaths.koodienHallinta),
          summaryApp: resolve(root, virkailijaPaths.yhteenveto),
          search: resolve(root, virkailijaPaths.haku),
          unauthorized: resolve(root, 'unauthorized.html'),
        },
        output: {
          dir: resolve(__dirname, '../../../server/resources/public/virkailija/'),
        },
      },
    },
  }
})
