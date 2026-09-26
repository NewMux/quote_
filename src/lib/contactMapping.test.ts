import { contactToClientInput, formatContactAddress } from './contactMapping';

describe('contactToClientInput', () => {
  it('uses the company as the client and the person as its contact', () => {
    expect(
      contactToClientInput({
        name: 'Lina Haddad',
        company: 'Harbor Coffee Co.',
        emails: [{ email: 'lina@harbor.co' }],
        phoneNumbers: [{ number: '+973 3333 4444' }],
      })
    ).toEqual({
      display_name: 'Harbor Coffee Co.',
      contact_name: 'Lina Haddad',
      email: 'lina@harbor.co',
      phone: '+973 3333 4444',
      address: null,
    });
  });

  it('uses the person as the client when there is no company', () => {
    expect(contactToClientInput({ firstName: 'Omar', lastName: 'Ali' })).toMatchObject({
      display_name: 'Omar Ali',
      contact_name: null,
      email: null,
      phone: null,
    });
  });

  it('prefers primary email and phone entries and skips empty ones', () => {
    const input = contactToClientInput({
      name: 'Sara',
      emails: [{ email: ' ' }, { email: 'work@x.com' }, { email: 'main@x.com', isPrimary: true }],
      phoneNumbers: [{ number: '' }, { number: '111' }],
    });
    expect(input?.email).toBe('main@x.com');
    expect(input?.phone).toBe('111');
  });

  it('returns null for a contact with no name or company', () => {
    expect(contactToClientInput({ emails: [{ email: 'a@b.c' }] })).toBeNull();
  });
});

describe('formatContactAddress', () => {
  it('joins the parts into one line', () => {
    expect(
      formatContactAddress({ street: '14 Harbor Street\nFloor 2', city: 'Manama', region: 'Capital', postalCode: '317', country: 'Bahrain' })
    ).toBe('14 Harbor Street, Floor 2, Manama, Capital 317, Bahrain');
  });

  it('returns null for missing or empty addresses', () => {
    expect(formatContactAddress(undefined)).toBeNull();
    expect(formatContactAddress({ street: '  ' })).toBeNull();
  });
});
