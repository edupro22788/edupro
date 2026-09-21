import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'nsfwjs',
    '@tensorflow/tfjs',
    '@tensorflow/tfjs-backend-wasm',
    '@vladmandic/face-api',
    'sharp',
  ],
};

export default nextConfig;
