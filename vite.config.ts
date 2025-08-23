import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
    'Buffer': 'Buffer',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      util: 'util',
      process: 'process',
      stream: 'stream-browserify',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'buffer',
      'process',
      'util',
      'stream-browserify',
      '@solana/web3.js',
      '@solana/spl-token',
      'bn.js'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        NodeModulesPolyfillPlugin()
      ]
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  }
});