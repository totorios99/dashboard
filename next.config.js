/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Allow images served via /api/photos from local filesystem
  serverExternalPackages: ['gray-matter', 'js-yaml'],
}

export default nextConfig
