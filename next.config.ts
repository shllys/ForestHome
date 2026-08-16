import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co", // Permite las imágenes guardadas en tu storage de Supabase
      },
    ],
  },
};

export default nextConfig;