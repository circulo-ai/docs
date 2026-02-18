import { withPayload } from '@payloadcms/next/withPayload'
import { loadRootEnv } from '@repo/env'

loadRootEnv()

const isWindows = globalThis.process?.platform === 'win32'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isWindows ? {} : { output: 'standalone' }),
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
