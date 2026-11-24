import React from 'react';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
