import type { NextConfig } from 'next'
import { validateHarnessStartup } from './src/guards'

// Startup guard (INTA-FE-R07, F04):
// Refuses Next.js dev server startup unconditionally before listening if environment is invalid or unsafe.
validateHarnessStartup(process.env)

const nextConfig: NextConfig = {}

export default nextConfig
