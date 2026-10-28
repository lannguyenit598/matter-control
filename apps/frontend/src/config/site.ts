/** Public, non-secret app settings. NEXT_PUBLIC_* values are inlined into the browser bundle. */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'MatterControl',
  description: 'Control plane for high-stakes legal work.',
}
