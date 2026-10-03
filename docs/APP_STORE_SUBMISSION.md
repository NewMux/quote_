# Invoice Them: App Store Submission Copy

Drafts for App Store Connect → Invoice Them → iOS 1.0. Each block is ready to paste. The character counts were checked against Apple's limits.

---

## App Information

| Field | Value |
| --- | --- |
| Subtitle (24 of 30) | `Estimate & Invoice Maker` |
| Primary category | **Business** |
| Secondary category | **Productivity** |
| Copyright | `2026 NewMux` |

App Store Connect adds the © itself, so the copyright field is just the year and the owner.

## Promotional Text (165 of 170)

```
Send polished estimates and invoices in minutes. Get them signed on the spot, add a Pay link with a QR code, and see at a glance who still owes you. Your first month is just $0.99.
```

## Keywords (96 of 100)

```
quote,billing,receipt,bill,estimator,contractor,freelance,signature,pdf,payment,tracker,handyman
```

"Invoice", "estimate" and "maker" are left out because the app name and subtitle are already indexed for search, and repeating them wastes characters.

## Description

```
Invoice Them turns the paperwork of running a small business into a few taps. Write an estimate on site, get it signed, turn it into an invoice, and see when you've been paid, all from your iPhone.

ESTIMATES AND INVOICES
• Line items, quantities, discounts and sales tax or VAT, with totals worked out for you
• Automatic numbering with your own prefixes
• Turn an accepted estimate into an invoice in one tap
• Recurring invoices: weekly, monthly, quarterly or yearly drafts, ready for you to review

YOUR BRAND ON EVERY PDF
• Your logo, colors, payment instructions and terms
• You and your client sign right on the screen
• Share the PDF or email it straight from the app

GET PAID FASTER
• Add a payment link from Stripe, PayPal or your bank, and every invoice gets a Pay button and a QR code
• Log cash, check and bank payments, with a receipt photo
• Partly paid, paid and overdue statuses update on their own
• Overdue reminders, so nothing slips through

EVERYTHING IN ONE PLACE
• A summary of what's outstanding, paid and overdue
• A client list with each client's documents and balance, and adding a client from your Contacts
• An item catalog for the products and services you sell
• Every currency, Light and Dark Mode, and VoiceOver support

PRIVATE BY DESIGN
Your account and data are stored securely in the cloud and kept private to your business. Export a backup at any time, or delete your account and everything in it from Settings.

INVOICE THEM PRO
Invoice Them requires an Invoice Them Pro subscription, monthly or yearly, and both start with a 1-month introductory offer at $0.99. Payment is charged to your Apple Account when you confirm the purchase, and the regular price applies after the first month. The subscription renews automatically unless you cancel at least 24 hours before the end of the current period. You can manage or cancel it in your Apple Account settings.

Privacy Policy: https://newmux.github.io/privacy.html
Terms of Use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
```

---

## Age Rating Questionnaire

Answer **None** to every frequency question and **No** to every yes/no question. The expected result is **4+**.

| Question | Answer | Why |
| --- | --- | --- |
| Cartoon or Fantasy Violence | None | |
| Realistic Violence | None | |
| Prolonged Graphic or Sadistic Realistic Violence | None | |
| Profanity or Crude Humor | None | |
| Mature or Suggestive Themes | None | |
| Horror/Fear Themes | None | |
| Medical/Treatment Information | None | |
| Alcohol, Tobacco, or Drug Use or References | None | |
| Simulated Gambling | None | |
| Sexual Content or Nudity | None | |
| Graphic Sexual Content and Nudity | None | |
| Unrestricted Web Access | No | Links open in Safari. The only web view draws the signature pad. |
| Gambling / Contests | No | |
| User-Generated Content | No | Everything a business enters is private to its own account, and nothing is shared or visible to other users. |
| Messaging and Chat | No | Emails go out through the device's own Mail app. |
| Advertising | No | |
| Parental Controls / Age Assurance | No | |
| Health or Wellness Topics | No | |

If the form offers "Made for Kids", leave it off.

---

## App Review Information

**Sign-in required:** Yes. Enter the demo account's email and password in the Sign-in Information fields. The password isn't stored in this repo.

**Contact information:** first and last name, a phone number and `info@newmux.com`.

### Notes (paste into "Notes")

```
Invoice Them lets small businesses create estimates and invoices, collect signatures on the device, send PDF invoices, and track payments. Data is stored in the business's own private account.

DEMO ACCOUNT
Use the email and password in Sign-in Information. The account has a finished business profile, three clients, catalog items, four invoices (paid, partly paid, overdue and draft) and an estimate.

SUBSCRIPTION / PAYWALL
The app requires the Invoice Them Pro auto-renewable subscription ("Invoice Them Pro" group: quote_pro_monthly and quote_pro_annual, each with a $0.99 1-month introductory offer). The demo account is not subscribed, so the paywall appears right after sign-in.
To test with a Sandbox account:
1. Sign in with the demo account. The paywall appears.
2. Choose Yearly or Monthly and tap Subscribe.
3. Confirm with your Sandbox Apple Account. The app opens to the Summary tab.
Restore Purchases is at the bottom of the paywall and under Settings > Invoice Them Pro, which also has Manage Subscription. The paywall links to the Privacy Policy and Apple's standard Terms of Use (EULA).

WHAT TO TRY
Documents tab > + > New Invoice: choose a client, add items, then tap Save (the checkmark). On the invoice, tap Issue Invoice, then try Sign, Share PDF and Log Payment. Open EST-001 and tap Convert to Invoice.

ACCOUNT DELETION (Guideline 5.1.1(v))
Settings tab > scroll to the bottom > Delete Account > type DELETE > Delete Account. This permanently deletes the login, every record and every stored file on our server. Delete All Data, just above it, clears the data but keeps the account.

OTHER NOTES
- Payment links: a business can add its own external payment link (for example a Stripe Payment Link) to invoices it sends to its clients. The link pays the business for real-world goods and services. The app does not process these payments or sell anything through them.
- Contacts access is requested only when the user taps Fill from Contacts or Add from Contacts, and only the chosen contact is read.
- Notifications are requested only when the user turns on Overdue Reminders in Settings.
- Sign-in uses email and password only, with no third-party or social login.
```

---

## Creating the Demo Account

1. **Supabase dashboard** → project `noble-kite` → **Authentication → Users → Add user → Create new user.**
   - Email: an inbox you control, such as `appreview@newmux.com`. Apple never needs to receive mail there.
   - Password: a strong one. Save it only in App Store Connect and your password manager.
   - Tick **Auto Confirm User**, so the email counts as confirmed with no link to click.
2. **SQL Editor → New query:**
   - Paste the contents of `supabase/seed/demo_account.sql`.
   - Change `v_email` on the first line of the `declare` block to the email from step 1.
   - Click **Run**. It should end with `Seeded the demo account …`.
   - The script refuses to run twice on the same account.
3. **Check it** on a TestFlight build: sign in as the demo account. The paywall should appear straight away, because the account has no subscription. Don't buy on this account, because the reviewer should see the paywall. If you want to see the data, subscribe with a different account, or buy the intro offer and then delete that customer under RevenueCat → Customers (search by the Supabase user ID). A reviewer's Sandbox account can't restore your purchase.
4. **Enter the email and password** under App Review Information → Sign-in Information.

The dates are relative to the day you run the script, so INV-003 shows as overdue. Run the script close to submitting. If review takes weeks, INV-002 will turn overdue too, which is fine.
