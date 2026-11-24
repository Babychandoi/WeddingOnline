import { canonicalUrl } from '@/lib/seo';

export const dynamic = 'force-static';

const PRIVATE_DISALLOW = [
  'Disallow: /api/',
  'Disallow: /admin/',
  'Disallow: /dashboard/',
  'Disallow: /partner',
].join('\n');

const CONTENT_SIGNAL = 'Content-Signal: search=yes, ai-input=yes, ai-train=no';

function group(agent: string): string {
  return [`User-agent: ${agent}`, 'Allow: /', PRIVATE_DISALLOW, CONTENT_SIGNAL].join('\n');
}

export function GET() {
  const body = [
    '# DamCuoiOnline.vn — Robots & AI Agent Access Policy (RFC 9309)',
    group('*'),
    '',
    '# AI Search & User-Triggered Assistants (explicitly allowed for search & direct user queries)',
    group('OAI-SearchBot'),
    '',
    group('ChatGPT-User'),
    '',
    group('Claude-SearchBot'),
    '',
    group('Claude-User'),
    '',
    group('PerplexityBot'),
    '',
    group('Perplexity-User'),
    '',
    `Sitemap: ${canonicalUrl('/sitemap.xml')}`,
    '',
  ].join('\n');

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
