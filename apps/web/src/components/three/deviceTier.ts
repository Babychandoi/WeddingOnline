/**
 * Phones, tablets and low-core machines get a lighter build of the photoreal pipeline:
 * fewer polygons per flower, no screen-space AO, a 2K shadow map, glass without the extra
 * transmission pass and no extra point lights. Desktops keep the full look.
 *
 * Decided once per page load (the 3D scene only ever runs in the browser).
 */
export const IS_HANDHELD: boolean = (() => {
  if (typeof window === 'undefined') return false;
  try {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
    return coarse || fewCores;
  } catch {
    return false;
  }
})();
