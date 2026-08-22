import createMDX from '@next/mdx'
import { redirectMap } from './src/lib/redirect-map.ts'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'files.cdn.printful.com' }],
  },
  async redirects() {
    return redirectMap()
  },
}

export default createMDX({})(nextConfig)
