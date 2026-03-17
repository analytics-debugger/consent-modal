/**
 * Maps readable class names to minified versions.
 * Used in source code (templates, render.ts, index.ts) as readable names.
 * Vite plugin replaces them at build time with the short versions.
 */
export const classMap: Record<string, string> = {
  // Layout
  'cm-backdrop': 'a',
  'cm-modal': 'b',
  'cm-card': 'c',
  'cm-content': 'd',
  'cm-visible': 'v',
  'cm-details': 'e',

  // Close & decoration
  'cm-close': 'f',
  'cm-deco': 'g',

  // Header
  'cm-header': 'h',
  'cm-logo': 'i',
  'cm-heading': 'j',
  'cm-subheading': 'k',

  // Description
  'cm-desc': 'l',

  // Buttons
  'cm-btn': 'm',
  'cm-btn-primary': 'n',
  'cm-btn-secondary': 'o',
  'cm-btn-ghost': 'p',
  'cm-actions': 'q',
  'cm-actions-row': 'r',

  // Categories
  'cm-categories': 's',
  'cm-category': 't',
  'cm-category-on': 'on',
  'cm-category-info': 'u',
  'cm-category-emoji': 'w',
  'cm-category-label': 'x',
  'cm-category-sublabel': 'y',
  'cm-category-desc': 'z',

  // Toggle
  'cm-toggle': 'aa',
  'cm-toggle-on': 'on',
  'cm-toggle-knob': 'ab',

  // Footer
  'cm-footer': 'ac',

  // CSS variables
  '--cm-accent': '--a',
  '--cm-accent-bg': '--a-bg',
}
