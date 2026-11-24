import { INVITATION_2D_TEMPLATES, type Invitation2DTemplateStyle, type InvitationTemplateMeta } from '@dco/shared';

/**
 * The order 2D templates are shown in when no style is picked: the 12 originals first, then the
 * rest dealt out one style at a time, so every screenful mixes traditional, romantic, modern…
 */
function interleaved(list: InvitationTemplateMeta[]): InvitationTemplateMeta[] {
  const head = list.slice(0, 12);
  const buckets = new Map<string, InvitationTemplateMeta[]>();
  for (const t of list.slice(12)) buckets.set(t.style, [...(buckets.get(t.style) ?? []), t]);
  const out = [...head];
  const queues = [...buckets.values()];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift()!);
  return out;
}

export const TEMPLATES_ORDERED: InvitationTemplateMeta[] = interleaved(INVITATION_2D_TEMPLATES);

export type StyleFilter = Invitation2DTemplateStyle | 'all';

export function templatesFor(style: StyleFilter): InvitationTemplateMeta[] {
  return style === 'all' ? TEMPLATES_ORDERED : TEMPLATES_ORDERED.filter((t) => t.style === style);
}

export function styleCount(style: StyleFilter): number {
  return templatesFor(style).length;
}
