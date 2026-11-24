'use client';

import { useEffect } from 'react';
import { INVITATION_TEMPLATES, VENUE_THEMES } from '@dco/shared';
import { venueSlug } from '@/lib/seo';

interface WebMcpContext {
  registerTool?: (tool: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (input: Record<string, unknown>) => Promise<unknown> | unknown;
  }) => void;
}

/**
 * Progressive-enhancement WebMCP registration (W3C Community Group draft).
 * Exposes safe, read-only catalog search tools for browser agents when `document.modelContext` is supported.
 */
export function WebMcpTools() {
  useEffect(() => {
    const doc = document as Document & { modelContext?: WebMcpContext };
    const nav = navigator as Navigator & { modelContext?: WebMcpContext };
    const mc = doc.modelContext ?? nav.modelContext;
    if (!mc || typeof mc.registerTool !== 'function') return;

    try {
      mc.registerTool({
        name: 'search_wedding_templates',
        description: 'Search DamCuoiOnline.vn catalog of 100 Vietnamese online wedding invitation templates by keyword or style.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Optional Vietnamese or ASCII search keyword (e.g. Song Hy, hoa sen, hien dai)' },
            style: { type: 'string', description: 'Optional style id (truyen-thong, lang-man, hien-dai, toi-gian, sang-trong, co-dien, thien-nhien, de-thuong)' },
          },
        },
        execute: ({ query, style }) => {
          const q = typeof query === 'string' ? query.trim().toLowerCase() : '';
          const s = typeof style === 'string' ? style.trim().toLowerCase() : '';
          return INVITATION_TEMPLATES.filter((t) => {
            if (s && t.style !== s) return false;
            if (!q) return true;
            return `${t.nameVi} ${t.descriptionVi} ${t.id}`.toLowerCase().includes(q);
          })
            .slice(0, 12)
            .map((t) => ({ id: t.id, name: t.nameVi, style: t.style, url: `/thiep-cuoi/${t.id}` }));
        },
      });

      mc.registerTool({
        name: 'search_3d_wedding_venues',
        description: 'Search DamCuoiOnline.vn catalog of 101 browser-based 3D wedding venues by keyword or region.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Optional keyword or location (e.g. Hoi An, Phu Quoc, Gia Tien, Da Lat)' },
            region: { type: 'string', description: 'Optional region (VIETNAM, EAST_ASIA, EUROPE, AMERICAS, OCEANIA)' },
          },
        },
        execute: ({ query, region }) => {
          const q = typeof query === 'string' ? query.trim().toLowerCase() : '';
          const r = typeof region === 'string' ? region.trim().toUpperCase() : '';
          return VENUE_THEMES.filter((v) => {
            if (r && v.region !== r) return false;
            if (!q) return true;
            return `${v.nameVi} ${v.place} ${v.descriptionVi} ${v.id}`.toLowerCase().includes(q);
          })
            .slice(0, 12)
            .map((v) => ({ id: v.id, name: v.nameVi, place: v.place, url: `/khong-gian/${venueSlug(v.id)}` }));
        },
      });
    } catch {
      // Non-fatal on browsers with experimental or locked WebMCP implementations
    }
  }, []);

  return null;
}
