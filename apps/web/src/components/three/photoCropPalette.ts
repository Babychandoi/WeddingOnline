// Broad red blocks with occasional yellow ribbons, as in the Lisse reference.
const TULIP_ROWS = [
  '#b84431', '#bd4134', '#d9b83a', '#b23d32', '#bd4533', '#a33545',
  '#b83c34', '#dabd43', '#b5433b', '#a73544',
];
const LAVENDER_ROWS = ['#77608f', '#805b9c', '#6c5486', '#76578b'];

export function tulipRowColor(row: number) {
  return TULIP_ROWS[row % TULIP_ROWS.length];
}

export function lavenderRowColor(row: number) {
  return LAVENDER_ROWS[row % LAVENDER_ROWS.length];
}
