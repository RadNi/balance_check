import { defineConfig } from 'vite'

import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ['path', 'stream', 'util'],
      exclude: ['http'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      overrides: {
        fs: 'memfs',
      },
      protocolImports: true,
    }),
  ],
  // other options
  // resolve: {
  //   alias: {
  //     buffer: 'buffer/',
  //   }
  // },

  optimizeDeps: {
    esbuildOptions: { target: "esnext" },
    exclude: ['@noir-lang/noirc_abi', '@noir-lang/acvm_js']
  }
})

// export default {
// };

// export default defineConfig({
//   // other options
//   plugins: [nodePolyfills()]
// })