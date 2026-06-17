import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/dashboard/competitors',
        destination: '/dashboard/intelligence',
        permanent: false,
      },
      {
        source: '/dashboard/gaps',
        destination: '/dashboard/intelligence',
        permanent: false,
      },
    ]
  },
}

export default nextConfig