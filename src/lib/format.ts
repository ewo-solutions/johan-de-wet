/** R1 450 000: space thousands separator, no decimals. */
export function formatRand(n: number): string {
  return 'R' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
