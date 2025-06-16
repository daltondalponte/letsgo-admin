/** @type {import('next').NextConfig} */
const nextConfig = { images: { domains: ['firebasestorage.googleapis.com'], formats: ['image/avif', 'image/webp'], }, output: 'standalone' }

module.exports = nextConfig
