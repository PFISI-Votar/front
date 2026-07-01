import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { playwright } from '@vitest/browser-playwright'
import { buildSecurityHeaders } from './src/config/security-headers'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.VITE_API_URL ?? 'http://localhost:3000'
  const devHeaders = buildSecurityHeaders({
    apiOrigin,
    isDev: true,
  })
  const previewHeaders = buildSecurityHeaders({
    apiOrigin,
    isDev: false,
    isHttps: true,
  })

  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      headers: devHeaders,
    },
    preview: {
      headers: previewHeaders,
    },
    test: {
      silent: 'passed-only',
      unstubEnvs: true,
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            include: ['src/**/*.test.ts'],
            exclude: [
              'src/hooks/use-table-url-state.test.ts',
              'src/lib/cookies.test.ts',
              'src/features/padron/lib/preview-storage.test.ts',
            ],
          },
        },
        {
          extends: true,
          test: {
            name: 'browser',
            include: [
              'src/**/*.test.tsx',
              'src/hooks/use-table-url-state.test.ts',
              'src/lib/cookies.test.ts',
              'src/features/padron/lib/preview-storage.test.ts',
            ],
            browser: {
              enabled: true,
              provider: playwright(),
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
      coverage: {
        exclude: [
          'src/components/ui/**',
          'src/assets/**',
          'src/tanstack-table.d.ts',
          'src/routeTree.gen.ts',
          'src/test-utils/**',
          'src/routes/**',
        ],
      },
    },
  }
})
