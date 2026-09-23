# Invoice Them: Project Status

_Last updated: September 23, 2026 · Branch `main` at `36d81a1`_

Invoice Them is an iOS app (it also runs on Android) that lets small businesses create estimates and invoices, get them signed, send them as PDFs, and track payments. It's built with Expo SDK 57, React Native 0.86, expo-router and NativeWind. Supabase stores the data and files, and RevenueCat sells the Invoice Them Pro subscription.

| | |
| --- | --- |
| App Store name | Invoice Them |
| Bundle ID / Android package | `com.newmux.invoicethem` |
| Subscription group | Invoice Them Pro: `quote_pro_monthly` ($9.99) and `quote_pro_annual` ($79.99), each with a 1-week free trial |
| Backend | Supabase project `dktncuoqcifbjvxmybnq` (Postgres, Auth, Storage, one Edge Function) |
| Builds | EAS: `development`, `preview` and `production` profiles in `eas.json` |
| Checks | `npx tsc --noEmit`, `npx eslint .`, `npx jest` (106 tests), `npx expo export` |

---

## What's done

### 1. Core invoicing (MVP, rounds 1–5)
- **Business profile:** name, logo, contact details, tax/VAT number, payment instructions, default terms, PDF accent color and currency (all ISO 4217 currencies, with currency-aware decimal math).
- **Clients:** create, edit, archive and delete, with an optional photo, notes and a tax number.
- **Item catalog and tax rates:** reusable items with a default price and unit. Tax rates are named (the PDF prints "VAT" rather than a generic "Tax") and one of them is the default.
- **Estimates and invoices:**
  - Line items and a document-level discount (percent or amount).
  - Automatic numbering with configurable prefixes and minimum digits, plus an optional yearly reset.
  - Issue and due dates, notes, and terms per document.
- **Status flow:**
  - Draft → Issued → Partially Paid / Paid, with Overdue worked out from the due date.
  - Canceled (void), with a reason.
  - An estimate converts into an invoice.
  - An activity log records every step.
- **Signatures:** you and your client each sign on the device.
- **PDF:** your logo and signatures on a printable template. Share it or email it, including overdue reminders.
- **Payments:** log, edit and delete them (method, date, reference, receipt photo, notes). Every change recalculates the invoice's balance and status.
- **Onboarding:** a four-step first-run setup (welcome, business basics, sales tax, done).

### 2. Usability and polish (rounds 6–20)
- Plain-language wording throughout, for people who aren't accountants.
- Search and filters: documents by status, client and date; clients by sort order and outstanding balance.
- Swipe actions on list rows, with the same actions available to VoiceOver.
- Fixed bugs:
  - a crash when deleting a converted estimate (foreign-key fix)
  - date-picker clipping
  - a raw UUID showing in the activity log
  - a picker whose search bar overlapped its list
  - text overflowing its container
- A Privacy Policy screen, Delete All Data, and Export Data (a JSON backup).
- A security audit: parameterized queries, private storage, no secrets in the repo, HTML escaping in PDFs, and an unused camera permission removed.

### 3. Accounts and cloud (rounds 21–27)
- **Supabase migration:**
  - Email and password accounts.
  - Each business's data is kept separate by row-level security.
  - Files (logos, photos, receipts, signatures, PDFs) live in a private Storage bucket, read through signed URLs.
- **Auth flows:** sign up, sign in, sign out, Forgot Password / Reset Password, and email deep links (`quoteapp://auth/callback`).
- **Account deletion:** a Supabase Edge Function (`delete-account`) removes all the user's data, files and their login. Apple requires this (App Store guideline 5.1.1(v)).
- **Atomic money operations:**
  - Numbering, saving edits, payments, estimate→invoice conversion and wiping data all run as single database transactions (Postgres functions), so a dropped connection can't leave half-saved data behind.
  - Document numbers can no longer be reserved twice.
- **Recurring invoices:** weekly, monthly, quarterly or yearly. A daily `pg_cron` job creates draft copies for you to review; nothing is sent automatically.
- **Overdue reminders:** local notifications, re-synced every time the app launches.
- **Replaced-file cleanup:** replacing a logo, photo, receipt or signature deletes the old file from Storage.
- **Engineering:** ESLint (Expo config) and Jest unit tests for money, status, calculation, numbering, formatting, recurrence, subscription and symbol logic.

### 4. Subscription and builds (round 24)
- **RevenueCat paywall:**
  - A hard paywall with a 1-week trial.
  - Restore Purchases, and the Apple-required renewal terms with links to the Privacy Policy and Terms of Use.
  - A Settings → Subscription screen with Manage Subscription.
  - Your RevenueCat user ID is your Supabase user ID, so the subscription follows your account.
- **Rename:** bundle ID `com.newmux.invoicethem`, app name Invoice Them.
- **EAS:** project linked; `.npmrc` sets `legacy-peer-deps` so installs on EAS succeed; the RevenueCat public iOS key is in every build profile.
- The first iOS development build installed and ran on a device.

### 5. Apple design pass (round 28)
- Light and Dark Mode, using iOS system-style colors.
- Native large-title navigation, header buttons and menus with SF Symbols, native search bars, and pull to refresh.
- Settings-style grouped lists. Sheets have Cancel on the left and the confirming action on the right.
- A prompt before discarding unsaved changes, applied to every form.
- Accessibility:
  - touch targets of at least 44pt
  - VoiceOver labels on switches, charts and icon-only buttons
  - keyboard handling, and a Done button above number pads
  - contrast fixes
- Fixed a timezone bug that saved dates one day early east of UTC.

### 6. iOS 26 native redesign (round 29, the latest)
- **System tab bar:** Liquid Glass on iOS 26, shrinking as you scroll. The icons are SF Symbols that fill in when the tab is selected.
- **SF Symbols everywhere**, through one `Icon` component with a checked Ionicons fallback for Android.
- **Apple text sizes** (Large Title through Caption) replace the generic sizes.
- **Summary (Home):**
  - A Wallet-style outstanding balance.
  - Health-style tiles for Paid, Unpaid, Overdue and Drafts.
  - A Needs Attention list of overdue invoices.
  - Charts in grouped cards.
- **Documents:** Mail-style rows showing client, amount, number, date and a status symbol.
- **Clients:** an A–Z list like Contacts. A client's page has Call and Mail buttons and their documents.
- **Document detail** reads like a receipt:
  - At the top: client, amount due, status and the next action.
  - Below: details, items, totals, payments, signatures, and an activity timeline.
- **Forms:** every edit screen uses rows with the label on the left and the field on the right, in grouped sections, like the Contacts editor.
- **Sheets:** round glass ✕ and ✓ buttons on iOS 26. Save in the nav bar becomes a green checkmark; older iOS shows text buttons.
- **Paywall, sign-in and onboarding** follow Apple's own layouts. The paywall's button sits in a glass bar at the bottom.
- **Removed:** the gradient hero, shadowed cards, the dark stat strips, and the `expo-linear-gradient` package.
- **Added:** `expo-symbols` and `expo-glass-effect` as direct dependencies.

---

## What's next

### Right now: test the redesign on a device
Round 29 adds native modules, so it needs a **new development build**:
```sh
git pull origin main && npm install
npx eas-cli@latest build --profile development --platform ios
# install the new build, then:
npx expo start --dev-client --tunnel --clear
```
Check:
- **iOS 26:** the glass tab bar shrinks on scroll, sheets show the round ✕/✓, and Save is a checkmark.
- **Older iOS:** the same screens appear, just without glass.
- **Appearance:** Light and Dark, and the largest text size.
- **Layout:** content scrolls clear of the tab bar on every screen.
- **Line items:** a quantity like 1.5 can be typed.
- **Summary:** tap Custom, then cancel; the period control goes back to the period in effect.
- **Sandbox purchase:** the trial starts, access persists after relaunch, and Restore works.

### Before TestFlight or App Store (blocking)
1. **Add the Supabase variables to `eas.json`** for the `preview` and `production` profiles (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`). EAS doesn't upload `.env`, so without these a cloud-built app can't reach the backend and stops at launch.
2. **Supabase dashboard:**
   - Add `quoteapp://auth/callback` under Authentication → URL Configuration → Redirect URLs. Sign-up confirmation and password-reset links need it.
   - Turn on leaked-password protection under Authentication → Settings.
3. **Host the Privacy Policy** at a public URL and enter it in App Store Connect. The in-app screen already exists.
4. **App Store Connect listing:**
   - screenshots taken from the new design
   - description and keywords
   - the privacy "nutrition label": account email, business and client data stored in Supabase, purchases through Apple and RevenueCat
   - an age rating
   - review notes with a demo account
5. **App icon and splash screen:** replace the placeholder assets in `assets/` with real artwork, including dark and tinted icon variants for iOS 18+.
6. **Match native package versions to SDK 57:** `expo-secure-store` 15.0.8 → `~57.0.4`, and `@react-native-community/datetimepicker` 9.2.1 → `9.1.0` (run `npx expo install --fix`). The current mismatch hasn't caused a crash, but it should be fixed before a store build.
7. **Production build and submit:**
   `npx eas-cli@latest build --profile production --platform ios`, then `npx eas-cli@latest submit --platform ios`.

### Soon after launch
- **Sign in with Apple:** one-tap sign-in for iPhone users.
- **Server push reminders:** overdue alerts that fire even when the app hasn't been opened. Needs an APNs key and Expo push tokens; local reminders cover this for now.
- **Android release:** add the RevenueCat Android key, create a Play Console listing, and set up Google Play billing products.
- **Clients list A–Z scrubber:** the letter index down the right edge, like Contacts.
- **Overdue badge on the Documents tab:** needs an all-time overdue count, separate from Summary's per-period figures.
- **Test coverage:** add component or integration tests for the key flows (create → issue → pay; subscription gate) next to the existing unit tests.

### Possible later features
- Online payment links on invoices (for example Stripe) so clients can pay directly.
- Team members sharing one business account.
- Offline mode that caches data and syncs later.
- More PDF templates and custom fields.
- Reports export (CSV) for an accountant.

---

## Reference
- **Test account:** `info@newmux.com` (the password was shared privately).
- **Running locally:**
  - Put the Supabase variables and `EXPO_PUBLIC_REVENUECAT_IOS_KEY` in `.env`.
  - Start Metro with `npx expo start --dev-client --tunnel`.
  - If the app shows "Could not connect to development server", Metro isn't running; start it, then Reload.
- **Security:** never put the Supabase `service_role` key in the app or the repo. It belongs only inside the Edge Function's server environment.
