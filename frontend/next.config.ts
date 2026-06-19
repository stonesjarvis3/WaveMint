import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK ?? 'testnet',
    NEXT_PUBLIC_CONTRACT_ID: process.env.NEXT_PUBLIC_CONTRACT_ID ?? '',
  },
  images: { unoptimized: true },
};

export default nextConfig;
