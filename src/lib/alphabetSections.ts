export interface AlphabetSection<T> {
  title: string;
  data: T[];
}

/** The section letter for a name, like Contacts: A–Z by first letter (accents folded), "#" for
 * anything else. */
export function sectionLetter(name: string): string {
  const first = name.trim().charAt(0).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
}

/** Groups items (already sorted by name) into lettered sections, keeping their order, with "#"
 * last. */
export function groupByInitial<T>(items: T[], getName: (item: T) => string): AlphabetSection<T>[] {
  const sections = new Map<string, T[]>();
  for (const item of items) {
    const letter = sectionLetter(getName(item));
    const list = sections.get(letter);
    if (list) list.push(item);
    else sections.set(letter, [item]);
  }
  return [...sections.entries()]
    .sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
    .map(([title, data]) => ({ title, data }));
}
