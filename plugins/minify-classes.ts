import type { Plugin } from 'vite'
import { classMap } from '../src/classmap'

/**
 * Vite plugin that replaces readable class names with minified versions.
 * Uses simple string replacement — safe because our class names are
 * prefixed with "cm-" which won't collide with other code.
 */
export function minifyClasses(): Plugin {
  // Sort by length descending so "cm-btn-primary" is replaced before "cm-btn"
  const entries = Object.entries(classMap).sort((a, b) => b[0].length - a[0].length)

  return {
    name: 'minify-classes',
    apply: 'build',
    enforce: 'pre',
    transform(code, id) {
      // Skip the classmap file itself and node_modules
      if (id.includes('classmap') || id.includes('node_modules')) return null
      // Only process our source files
      if (!id.match(/\.(css|html|ts|js|svg)(\?raw)?$/)) return null

      let result = code
      for (const [readable, minified] of entries) {
        result = result.replaceAll(readable, minified)
      }

      if (result !== code) {
        return { code: result, map: null }
      }
      return null
    },
  }
}
