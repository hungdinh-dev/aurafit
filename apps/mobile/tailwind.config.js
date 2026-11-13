/**
 * NativeWind is used for LAYOUT only (flex, gap, padding, margin, sizing) – D-039.
 * Colors, typography and radii come from `src/ui/theme.ts` via the UI kit.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // 8-pt grid helpers matching theme.spacing
      spacing: { gutter: '16px', section: '28px' },
    },
  },
  plugins: [],
};
