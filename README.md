# Quote — Mobile Invoice & Estimate Generator

A local-first, offline-capable Expo app for creating estimates and invoices,
capturing signatures, generating PDFs, and tracking payments — no backend
required. All data lives in an on-device SQLite database.

## Running it

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

## What's implemented (P0 MVP)

- Estimate/invoice creation with line items, per-line discounts, and
  configurable tax brackets
- One-tap estimate → invoice conversion
- Touchscreen signature capture (merchant + client)
- Client-side PDF generation and export via the native share sheet / email
- Client directory and item/service catalog with one-tap insertion
- Status tracking (Draft, Issued, Partially Paid, Paid, Overdue, Void)
- Manual settlement logging (cash/bank/check + optional receipt photo)
- Fully offline — all data and PDF generation happen on-device
- Business profile branding (logo, accent color, payment instructions, terms)
- Auto-incrementing document numbering with configurable prefixes

Out of scope for this build: any backend/server, real transactional
email/SMS/WhatsApp dispatch, push notifications, multi-currency,
multi-user accounts, recurring invoices, and in-app payment collection.

## Suggested test flow

1. **Settings → Business Profile** — set a business name, logo, and accent color.
2. **Clients** tab — add a client.
3. **Items** tab — add a catalog item with a tax bracket.
4. **Documents** tab → **+** → create an Estimate, add line items, tap Done.
5. On the estimate's detail screen: Issue it, sign as merchant and client,
   Share/Email the PDF, then Convert to Invoice.
6. On the resulting invoice: log a partial payment, then a final payment —
   status should auto-transition to Partially Paid then Paid.
7. Try airplane mode at any point — everything above should keep working.
