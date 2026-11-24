import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
if (fs.existsSync(rootEnvPath)) {
  for (const raw of fs.readFileSync(rootEnvPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@dco/shared', '@dco/database', 'three'],
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  async redirects() {
    return [
      { source: '/privacy', destination: '/chinh-sach-bao-mat', permanent: true },
      { source: '/terms', destination: '/dieu-khoan-su-dung', permanent: true },
    ];
  },
  /**
   * 3D people, models, photo-scanned assets and venue thumbnails are large static files that
   * rarely change. Let browsers (and the edge) keep them a day instead of re-downloading
   * several MB every time a guest walks into the hall.
   */
  async headers() {
    const cache = [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }];
    const securityHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
      {
        key: 'Content-Security-Policy',
        value:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; media-src 'self' data: blob: https:; worker-src 'self' blob:; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https:",
      },
    ];
    return [
      { source: '/(.*)', headers: securityHeaders },
      ...[
        '/assets/people/:path*',
        '/assets/ph/:path*',
        '/assets/venue-references/:path*',
        '/assets/venues/:path*',
        '/invitation-samples/:path*',
        '/fonts/:path*',
        '/models/:path*',
        '/venues/:path*',
      ].map((source) => ({ source, headers: cache })),
    ];
  },
};

export default nextConfig;
