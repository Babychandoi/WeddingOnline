/*
 * The invitation faces are self-hosted: scripts/fetch-fonts.mjs downloads their Vietnamese +
 * Latin subsets into public/fonts and writes app/fonts.css, which declares every @font-face and
 * the --f-* variables on :root (themes.ts reads them through var(--f-…)). Each @font-face keeps
 * its unicode-range, so the browser downloads only the faces and subsets a template uses.
 *
 * Kept as an export so components can still add it to their class list.
 */
export const INVITATION_FONT_VARS = '';
