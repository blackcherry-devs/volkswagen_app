import type { NextConfig } from "next";
import os from "os";

// Detectar automáticamente todas las IPs locales (IPv4) de la máquina para desarrollo móvil
const devOrigins: string[] = ['localhost', 'localhost:3000', '127.0.0.1', '192.168.1.180', '192.168.1.75'];

try {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        devOrigins.push(iface.address);
        devOrigins.push(`${iface.address}:3000`);
      }
    }
  }
} catch (e) {
  // Fallback si networkInterfaces falla
}

const nextConfig: NextConfig = {
  allowedDevOrigins: Array.from(new Set(devOrigins)),
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
