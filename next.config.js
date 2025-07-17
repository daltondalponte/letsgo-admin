/** @type {import('next').NextConfig} */
const nextConfig = { 
  images: { 
    domains: ['localhost'], 
    formats: ['image/avif', 'image/webp'], 
  }, 
  output: 'standalone',
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg',
  },
  // Configurações para aumentar limite de tamanho da requisição
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // No lado do cliente, resolver undici para false
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "undici": false,
        "fs": false,
        "net": false,
        "tls": false,
      };
    }
    
    // Adicionar regra para ignorar erros de parsing do Firebase
    config.module.rules.push({
      test: /node_modules\/@firebase/,
      use: 'ignore-loader'
    });
    
    return config;
  },
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig
