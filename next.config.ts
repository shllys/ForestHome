import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',        // Genera los archivos HTML/CSS/JS estáticos
  images: {
    unoptimized: true,    // Desactiva la optimización de imágenes de servidor
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

