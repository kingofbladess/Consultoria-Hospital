import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El indicador de desarrollo de Next.js tapaba el usuario en la barra lateral.
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
