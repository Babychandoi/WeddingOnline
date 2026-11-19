const BANNED_TOKENS = [
  'dm',
  'dmm',
  'dcm',
  'dkm',
  'vcl',
  'vkl',
  'vl',
  'cc',
  'cl',
  'lon',
  'cac',
  'buoi',
  'du ma',
  'dit',
  'deo',
  'ngu',
  'cho chet',
  'fuck',
  'shit',
  'bitch',
  'asshole',
];

function stripVietnameseDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function filterVietnameseProfanity(input: string): string {
  let result = input;
  const words = result.split(/(\s+)/);
  result = words
    .map((segment) => {
      if (/^\s+$/.test(segment) || segment.length === 0) return segment;
      const normalized = stripVietnameseDiacritics(segment)
        .replace(/[^a-z0-9]/g, '')
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a');
      if (BANNED_TOKENS.includes(normalized)) {
        return '*'.repeat(Math.max(2, segment.length));
      }
      return segment;
    })
    .join('');

  // Multi-word patterns
  const normalizedFull = stripVietnameseDiacritics(result).replace(/[^a-z0-9\s]/g, ' ');
  for (const phrase of BANNED_TOKENS.filter((t) => t.includes(' '))) {
    if (normalizedFull.includes(phrase)) {
      const regex = new RegExp(phrase.split(' ').join('\\s+'), 'gi');
      result = stripVietnameseDiacritics(result).replace(regex, '***');
    }
  }
  return result;
}

export function sanitizeBubbleText(raw: string, maxLength = 80): string {
  const collapsed = raw.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  return filterVietnameseProfanity(collapsed);
}
