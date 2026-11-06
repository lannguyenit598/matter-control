import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/nextjs-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/nextjs-vite',
  // W6 (UX-B-12): the iframe/manager HTML references /favicon.ico; with only the (empty)
  // public dir served it 404'd once per browser session on whichever story triggered the
  // fetch. Serve the app favicon from a Storybook-scoped static dir (no Next impact).
  staticDirs: ['../public', './static'],
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
