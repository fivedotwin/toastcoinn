import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      util: 'util',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'process',
      'util',
      '@solana/web3.js',
      '@solana/spl-token',
      'bn.js'
    ],
    esbuildOptions: {
      plugins: [
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
});
