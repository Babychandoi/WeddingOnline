import { NextRequest, NextResponse } from 'next/server';

const MARKDOWN_ELIGIBLE = new Set([
  '/',
  '/thiep-cuoi',
  '/khong-gian',
  '/bang-gia',
  '/ve-chung-toi',
  '/huong-dan',
  '/huong-dan/tao-thiep-cuoi-online',
  '/huong-dan/mung-cuoi-vietqr',
  '/huong-dan/dam-cuoi-online-3d',
  '/so-sanh/thiep-cuoi-online-va-thiep-giay',
]);

function prefersMarkdown(accept: string): boolean {
  if (!accept) return false;
  const lower = accept.toLowerCase();
  if (!lower.includes('text/markdown')) return false;
  // Browser requests include text/html; only negotiate Markdown when the client explicitly asks for text/markdown
  // without listing text/html ahead of it.
  const mdIdx = lower.indexOf('text/markdown');
  const htmlIdx = lower.indexOf('text/html');
  return htmlIdx === -1 || mdIdx < htmlIdx;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  if (MARKDOWN_ELIGIBLE.has(normalized)) {
    const accept = req.headers.get('accept') || '';
    if (prefersMarkdown(accept)) {
      const target = req.nextUrl.clone();
      target.pathname = '/api/markdown';
      target.searchParams.set('path', normalized);
      return NextResponse.rewrite(target);
    }
    const res = NextResponse.next();
    res.headers.append('Vary', 'Accept');
    res.headers.set('Content-Signal', 'search=yes, ai-input=yes, ai-train=no');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/thiep-cuoi',
    '/khong-gian',
    '/bang-gia',
    '/ve-chung-toi',
    '/huong-dan',
    '/huong-dan/:path*',
    '/so-sanh/:path*',
  ],
};
