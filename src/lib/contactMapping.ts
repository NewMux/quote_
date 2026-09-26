import type { ClientInput } from '../db/repositories/clients.repo';

/** The subset of a phone contact (expo-contacts' contact shape) that a client is built from. */
export interface PickedContact {
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  emails?: { email?: string; isPrimary?: boolean }[];
  phoneNumbers?: { number?: string; isPrimary?: boolean }[];
  addresses?: { street?: string; city?: string; region?: string; postalCode?: string; country?: string }[];
}

const clean = (value: string | undefined | null) => (value ?? '').trim();

function primaryFirst<T extends { isPrimary?: boolean }>(items: T[] | undefined): T[] {
  return [...(items ?? [])].sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary));
}

/** One-line postal address: "12 Harbor St, Manama, Capital 317, Bahrain". */
export function formatContactAddress(address: NonNullable<PickedContact['addresses']>[number] | undefined): string | null {
  if (!address) return null;
  const street = clean(address.street).replace(/\s*\n\s*/g, ', ');
  const cityLine = [clean(address.city), [clean(address.region), clean(address.postalCode)].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  const text = [street, cityLine, clean(address.country)].filter(Boolean).join(', ');
  return text || null;
}

/** Maps a picked contact to new-client fields. A contact with a company becomes a business client
 * (company as the name, the person as its contact); otherwise the person's name is the client. */
export function contactToClientInput(contact: PickedContact): ClientInput | null {
  const person = clean(contact.name) || [clean(contact.firstName), clean(contact.lastName)].filter(Boolean).join(' ');
  const company = clean(contact.company);
  const displayName = company || person;
  if (!displayName) return null;
  return {
    display_name: displayName,
    contact_name: company && person ? person : null,
    email: clean(primaryFirst(contact.emails).find((e) => clean(e.email))?.email) || null,
    phone: clean(primaryFirst(contact.phoneNumbers).find((p) => clean(p.number))?.number) || null,
    address: formatContactAddress(contact.addresses?.[0]),
  };
}
