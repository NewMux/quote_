import { groupByInitial, sectionLetter } from './alphabetSections';

describe('sectionLetter', () => {
  it('uses the uppercase first letter', () => {
    expect(sectionLetter('acme')).toBe('A');
    expect(sectionLetter('  Zed')).toBe('Z');
  });

  it('folds accents', () => {
    expect(sectionLetter('Élan Studio')).toBe('E');
  });

  it('puts digits, symbols, and other scripts under #', () => {
    expect(sectionLetter('3M')).toBe('#');
    expect(sectionLetter('@home')).toBe('#');
    expect(sectionLetter('شركة')).toBe('#');
    expect(sectionLetter('')).toBe('#');
  });
});

describe('groupByInitial', () => {
  it('groups in order with # last', () => {
    const names = ['3M', 'Acme', 'apex', 'Bolt', 'Élan'];
    const sections = groupByInitial(names, (n) => n);
    expect(sections).toEqual([
      { title: 'A', data: ['Acme', 'apex'] },
      { title: 'B', data: ['Bolt'] },
      { title: 'E', data: ['Élan'] },
      { title: '#', data: ['3M'] },
    ]);
  });

  it('returns no sections for no items', () => {
    expect(groupByInitial([], (n: string) => n)).toEqual([]);
  });
});
