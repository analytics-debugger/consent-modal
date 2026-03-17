import { defineConfig } from 'vite'
import { resolve } from 'path'
import { minifyClasses } from './plugins/minify-classes'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ConsentModal',
      fileName: (format) => format === 'umd' ? 'dta-cm.umd.js' : 'dta-cm.js',
    },
    cssMinify: true,
    minify: 'oxc',
  },
  plugins: [minifyClasses()],
})
