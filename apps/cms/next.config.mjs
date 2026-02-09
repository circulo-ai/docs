import { withPayload } from '@payloadcms/next/withPayload'
import { loadEnvConfig } from '@next/env'
import path from 'node:path'
import process from 'node:process'

const projectRoot = path.resolve(process.cwd(), '../..')
loadEnvConfig(projectRoot)

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
