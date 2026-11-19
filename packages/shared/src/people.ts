/**
 * Realistic people (Microsoft Rocketbox, MIT) a guest can choose to attend as. Converted by
 * scripts/convert-rocketbox.mjs into apps/web/public/assets/people/<id>.glb (+ <id>.webp portrait).
 */
export interface PersonInfo {
  id: string;
  body: 'f' | 'm';
  /** Short description for the picker (outfit, look) */
  label?: string;
}

/** Dressed-up looks first: suits and party wear suit a wedding best */
export const PEOPLE: PersonInfo[] = [
  { id: 'business_female_01', body: 'f', label: 'Vest đen' },
  { id: 'business_female_02', body: 'f', label: 'Vest đỏ đô' },
  { id: 'business_female_03', body: 'f', label: 'Vest nâu, chân váy' },
  { id: 'business_female_04', body: 'f', label: 'Vest đen thanh lịch' },
  { id: 'female_party_02', body: 'f', label: 'Đầm ngắn họa tiết' },
  { id: 'female_party_01', body: 'f', label: 'Áo hai dây, quần short' },
  { id: 'female_adult_15', body: 'f', label: 'Sơ mi xanh, chân váy' },
  { id: 'female_adult_11', body: 'f', label: 'Đầm nâu, bốt' },
  { id: 'female_adult_14', body: 'f', label: 'Blazer be' },
  { id: 'female_adult_05', body: 'f', label: 'Vest hồng nhạt' },
  { id: 'female_adult_02', body: 'f', label: 'Áo trắng, chân váy jean' },
  { id: 'female_adult_03', body: 'f', label: 'Áo hai dây tím' },
  { id: 'female_adult_01', body: 'f', label: 'Sơ mi hồng, jean' },
  { id: 'female_adult_04', body: 'f', label: 'Áo khoác da nâu' },
  { id: 'female_adult_07', body: 'f', label: 'Áo khoác nâu, bốt' },
  { id: 'female_adult_08', body: 'f', label: 'Áo thun xám, jean' },
  { id: 'female_adult_09', body: 'f', label: 'Áo khoác len xám' },
  { id: 'female_adult_12', body: 'f', label: 'Áo khoác đen, quần short' },
  { id: 'female_adult_13', body: 'f', label: 'Gile xám, jean' },
  { id: 'female_adult_17', body: 'f', label: 'Áo thun xanh lá' },
  { id: 'female_adult_06', body: 'f', label: 'Khăn hijab, áo dài' },
  { id: 'female_adult_10', body: 'f', label: 'Áo choàng abaya' },
  { id: 'female_adult_16', body: 'f', label: 'Áo choàng burqa' },
  { id: 'business_male_01', body: 'm', label: 'Vest đen, cà vạt đỏ' },
  { id: 'business_male_02', body: 'm', label: 'Vest xanh navy' },
  { id: 'business_male_03', body: 'm', label: 'Vest đen, cà vạt xanh' },
  { id: 'business_male_05', body: 'm', label: 'Vest đen, cà vạt tím' },
  { id: 'business_male_04', body: 'm', label: 'Gile đen, sơ mi xám' },
  { id: 'business_male_06', body: 'm', label: 'Sơ mi trắng, quần tây' },
  { id: 'business_male_07', body: 'm', label: 'Sơ mi trắng, cà vạt' },
  { id: 'male_adult_03', body: 'm', label: 'Blazer xám' },
  { id: 'male_adult_08', body: 'm', label: 'Sơ mi xanh nhạt' },
  { id: 'male_adult_14', body: 'm', label: 'Sơ mi xám, quần kaki' },
  { id: 'male_adult_11', body: 'm', label: 'Sơ mi xanh rêu' },
  { id: 'male_adult_02', body: 'm', label: 'Áo len be' },
  { id: 'male_adult_06', body: 'm', label: 'Áo len đỏ' },
  { id: 'male_adult_13', body: 'm', label: 'Áo len họa tiết' },
  { id: 'male_adult_07', body: 'm', label: 'Áo khoác xám' },
  { id: 'male_adult_10', body: 'm', label: 'Áo khoác đỏ' },
  { id: 'male_adult_04', body: 'm', label: 'Áo khoác đen' },
  { id: 'male_adult_05', body: 'm', label: 'Áo gile kaki' },
  { id: 'male_adult_12', body: 'm', label: 'Áo khoác jean' },
  { id: 'male_adult_09', body: 'm', label: 'Áo thun đen' },
  { id: 'male_adult_16', body: 'm', label: 'Áo thun xanh' },
  { id: 'male_adult_17', body: 'm', label: 'Áo khoác xanh trắng' },
  { id: 'male_adult_18', body: 'm', label: 'Hoodie xám' },
  { id: 'male_adult_20', body: 'm', label: 'Hoodie nâu' },
  { id: 'male_adult_01', body: 'm', label: 'Áo polo, quần short' },
  { id: 'male_adult_15', body: 'm', label: 'Áo kurta trắng' },
  { id: 'male_adult_19', body: 'm', label: 'Áo dishdasha, khăn đỏ' },
  { id: 'male_adult_21', body: 'm', label: 'Áo dishdasha trắng' },
];

export const PERSON_IDS = PEOPLE.map((p) => p.id);

/** A known person id, or '' (the stylised, drawn figure) */
export function sanitizePersonId(value: unknown): string {
  return typeof value === 'string' && PERSON_IDS.includes(value) ? value : '';
}
