import React from 'react';
import { Image, ImageProps } from '@nextui-org/react';

interface ImageWithProxyProps extends Omit<ImageProps, 'src'> {
  src?: string;
  fallbackSrc?: string;
}

export function ImageWithProxy({ src, fallbackSrc, ...props }: ImageWithProxyProps) {
  // Se não há src, usar fallback
  if (!src) {
    return <Image src={fallbackSrc} {...props} />;
  }

  // Se já é uma URL absoluta (http/https), usar diretamente
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return <Image src={src} {...props} />;
  }

  // Se é uma URL relativa que começa com /api/image-proxy, usar o backend principal
  if (src.startsWith('/api/image-proxy')) {
    const backendUrl = process.env.NEXT_PUBLIC_IMAGE_PROXY_URL || 'http://localhost:3008/api/image-proxy';
    const proxyUrl = src.replace('/api/image-proxy', backendUrl);
    return <Image src={proxyUrl} {...props} />;
  }

  // Para outras URLs relativas, assumir que são do backend principal
  const backendUrl = process.env.NEXT_PUBLIC_IMAGE_PROXY_URL || 'http://localhost:3008/api/image-proxy';
  const proxyUrl = `${backendUrl}?file=${encodeURIComponent(src)}`;
  
  return <Image src={proxyUrl} {...props} />;
} 