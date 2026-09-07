import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite unauthorized()/forbidden() para páginas 401/403 dedicadas.
    authInterrupts: true,
  },
};

export default nextConfig;
