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
  const rpcOrigin = env.VITE_RPC_URL ?? 'http://127.0.0.1:8545'
  const isDev = mode === 'development'
  const extraConnectSrc = isDev
    ? [
        rpcOrigin,
        // Hardhat accepts both hostnames; CSP treats them as distinct origins.
        'http://127.0.0.1:8545',
        'http://localhost:8545',
      ]
    : []
  const devHeaders = buildSecurityHeaders({
    apiOrigin,
    isDev: true,
    extraConnectSrc,
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
          // Pre-bundle deps used across browser suites so Vite does not
          // mid-run optimize+reload (flake: Failed to fetch dynamically imported module).
          optimizeDeps: {
            include: [
              'react',
              'react/jsx-runtime',
              'react/jsx-dev-runtime',
              'react-dom',
              'react-dom/client',
              'react-top-loading-bar',
              '@tanstack/react-query',
              '@tanstack/react-router',
              'axios',
              'recharts',
              'lucide-react',
            ],
          },
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
