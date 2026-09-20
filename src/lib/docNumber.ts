export function formatDocNumber(
  prefix: string,
  sequence: number,
  padding: number,
  yearBucket: number
): string {
  const padded = String(sequence).padStart(padding, '0');
  if (yearBucket > 0) {
    return `${prefix}${yearBucket}-${padded}`;
  }
  return `${prefix}${padded}`;
}
