import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { GlassSurface } from './glass-surface'

/**
 * The liquid glass material over a colourful backdrop, shown in both themes with the theme
 * toolbar (light / dark). Chromium renders the refraction tier; Safari and Firefox render the
 * frosted fallback; reduced transparency resolves the opaque tier.
 */
const meta = {
  title: 'Molecules/GlassSurface',
  component: GlassSurface,
} satisfies Meta<typeof GlassSurface>

export default meta
type Story = StoryObj<typeof meta>

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative isolate flex min-h-64 items-center justify-center overflow-hidden rounded-xl p-8"
      style={{
        background:
          'radial-gradient(circle at 20% 30%, oklch(0.75 0.15 200 / 0.9), transparent 60%),' +
          'radial-gradient(circle at 75% 65%, oklch(0.7 0.18 330 / 0.85), transparent 55%),' +
          'linear-gradient(135deg, oklch(0.55 0.08 260), oklch(0.35 0.06 260))',
      }}
    >
      {children}
    </div>
  )
}

export const Dialog: Story = {
  args: { children: null },
  render: () => (
    <Backdrop>
      <GlassSurface radius={14} bezel={12} refraction={8} frost={0.72} className="w-80 rounded-xl">
        <div className="p-5">
          <p className="text-base font-semibold">Liquid glass panel</p>
          <p className="mt-1 text-sm opacity-80">
            The control-room and dialog surfaces; content stays readable on every tier.
          </p>
        </div>
      </GlassSurface>
    </Backdrop>
  ),
}

export const RefractingRim: Story = {
  args: { children: null },
  render: () => (
    <Backdrop>
      <GlassSurface
        radius={20}
        bezel={28}
        refraction={24}
        frost={0.35}
        pointerLight
        className="w-96 rounded-[20px]"
      >
        <div className="p-6">
          <p className="text-base font-semibold">Strong rim refraction</p>
          <p className="mt-1 text-sm opacity-80">
            Move the pointer across the surface: the rim light follows it (motion-gated).
          </p>
        </div>
      </GlassSurface>
    </Backdrop>
  ),
}
