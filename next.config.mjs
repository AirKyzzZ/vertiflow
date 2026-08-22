import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'files.cdn.printful.com' }],
  },
}

export default createMDX({})(nextConfig)
