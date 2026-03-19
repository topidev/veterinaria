import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },

  images: {
    remotePatterns: [
      {
        // Supabase Storage — avatares, fotos de mascotas, documentos
        //
        // El hostname sigue el patrón: TU_PROJECT_ID.supabase.co
        // Encuéntralo en: supabase.com → tu proyecto → Settings → API → Project URL
        //
        // Ejemplo real: si tu Project URL es
        //   https://abcxyz123.supabase.co
        // entonces el hostname es:
        //   abcxyz123.supabase.co
        //   https://zsjvbcltydfodbboyufi.supabase.co -> project_id
        //
        // IMPORTANTE: reemplaza TU_PROJECT_ID con tu ID real.
        // Mientras tanto, el wildcard *.supabase.co funciona en desarrollo.
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Para desarrollo local con Supabase CLI (supabase start)
        // El storage local corre en localhost:54321
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig