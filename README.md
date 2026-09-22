# Quote — Mobile Invoice & Estimate Generator

A multi-tenant Expo app for creating estimates and invoices, capturing
signatures, generating PDFs, and tracking payments. Backed by Supabase
(Postgres + Auth + Storage) — each business signs up for its own account,
and its data is kept private and isolated from every other business using
the app, enforced by database-level Row Level Security. The app requires an
internet connection; there is no offline mode.

## Running it

You'll need a Supabase project's URL and anon/public API key (Settings →
API in the Supabase dashboard). Create a `.env` file from the example and
fill those in:

```bash
cp .env.example .env
# then edit .env with your EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Apply the schema in `supabase/migrations/` to that project (via the
Supabase CLI, dashboard SQL editor, or the Supabase MCP tools), then:

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone (iOS or Android), or
press `i` / `a` in the terminal to launch an iOS Simulator / Android
emulator.

If any native module fails to load inside Expo Go (uncommon, but possible
depending on the exact Expo Go client version on your device), build a
custom dev client instead:

```bash
npx expo install expo-dev-client
npx expo run:android   # or: npx expo run:ios
```

## What's implemented

- Email/password sign-up, sign-in, forgot-password/reset, and full account
  deletion (a server-side Edge Function cascades the delete across every
  table, every stored file, and the login itself)
- Estimate/invoice creation with line items, per-line discounts, and
  configurable tax brackets
- One-tap estimate → invoice conversion
- Touchscreen signature capture (merchant + client), stored in Supabase
  Storage
- Client-side PDF generation and export via the native share sheet / email
- Client directory and item/service catalog with one-tap insertion
- Status tracking (Draft, Issued, Partially Paid, Paid, Overdue, Void)
- Manual settlement logging (cash/bank/check + optional receipt photo)
- Business profile branding (logo, accent color, payment instructions, terms)
- Auto-incrementing document numbering with configurable prefixes
- JSON data export/backup from Settings

Not yet implemented: an in-app subscription paywall (Apple In-App
Purchase, planned), Sign in with Apple, real transactional email/SMS/
WhatsApp dispatch, push notifications, multi-user/team accounts per
business, and recurring invoices.

## Suggested test flow

1. **Sign up** with an email and password, confirm the account (or use one
   created directly in Supabase for testing), and sign in.
2. **Settings → Business Profile** — set a business name, logo, and accent color.
3. **Clients** tab — add a client.
4. **Items** tab — add a catalog item with a tax bracket.
5. **Documents** tab → **+** → create an Estimate, add line items, tap Done.
6. On the estimate's detail screen: Issue it, sign as merchant and client,
   Share/Email the PDF, then Convert to Invoice.
7. On the resulting invoice: log a partial payment, then a final payment —
   status should auto-transition to Partially Paid then Paid.
8. Sign out and sign back in — everything above should still be there,
   fetched fresh from Supabase.
