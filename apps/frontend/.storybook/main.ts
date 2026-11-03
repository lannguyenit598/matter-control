import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/nextjs-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['../public'],
  // Next.js compiles Tailwind through Turbopack; Storybook (Vite) needs the Vite plugin. The
  // navigation mock (UX-L-06) answers every `next/navigation` read so stories of components
  // under a page never crash on a missing router.
  viteFinal: (viteConfig) => {
    const resolve = (viteConfig.resolve ?? {}) as { alias?: unknown }
    const aliases = Array.isArray(resolve.alias) ? resolve.alias : []
    return {
      ...viteConfig,
      plugins: [...(viteConfig.plugins ?? []), tailwindcss()],
      resolve: {
        ...resolve,
        alias: [
          ...aliases,
          {
            find: 'next/navigation',
            replacement: fileURLToPath(new URL('./navigation-mock.ts', import.meta.url)),
          },
        ],
      },
    }
  },
}

export default config
