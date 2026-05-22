/** @type {import('next').NextConfig} */
const allowedDevOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://192.168.0.105:3000",
  process.env.NGROK_URL,
].filter(Boolean);

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins,
};

export default nextConfig
