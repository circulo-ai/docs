import { withPayload } from '@payloadcms/next/withPayload'
import { loadRootEnv } from '@repo/env'

loadRootEnv()

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
