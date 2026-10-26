# Auth email setup (confirm email and reset password)

Supabase's default email links are one-time links that Supabase itself consumes when the link is
opened. If the mail app's built-in browser, a link scanner or a second tap gets there first, the
token is used up and the app shows "Email link is invalid or has expired" (seen on October 26,
2026: the first tap verified the link at Supabase and the app never received the token; the second
tap failed).

The fix: the email links to a page on the site, `site/auth.html`, which hands the token to the
app (`quoteapp://auth/callback?token_hash=…&type=…`). The page never contacts Supabase, so nothing
is used up until the app verifies the token itself. The app's callback screen already accepts this
link shape, so **this works with the builds already released; no rebuild is needed.**

## Setup (about 5 minutes)

1. **Publish the page.** Copy `site/auth.html` to the root of the `NewMux/newmux.github.io` repo
   so it is served at `https://newmux.github.io/auth.html`, and push. Open the address in a
   browser: it should say "This link didn't work" (it has no token), not a 404.
2. **Supabase → Authentication → URL Configuration**
   - Site URL: `https://newmux.github.io` (not `http://localhost:3000`).
   - Redirect URLs: keep `quoteapp://auth/callback`.
3. **Supabase → Authentication → Email Templates** (change the two below; leave the rest):

   **Confirm signup**: subject `Confirm your Invoice Them account`

   ```html
   <h2>Confirm your email</h2>
   <p>Thanks for signing up for Invoice Them. Open this email on your iPhone and tap the button to confirm your email address.</p>
   <p><a href="https://newmux.github.io/auth.html?token_hash={{ .TokenHash }}&type=signup">Confirm email</a></p>
   <p>If you didn't create an account, you can ignore this email.</p>
   ```

   **Reset password**: subject `Reset your Invoice Them password`

   ```html
   <h2>Reset your password</h2>
   <p>Open this email on your iPhone and tap the button to choose a new password.</p>
   <p><a href="https://newmux.github.io/auth.html?token_hash={{ .TokenHash }}&type=recovery">Reset password</a></p>
   <p>If you didn't ask for this, you can ignore this email.</p>
   ```

4. **Supabase → Authentication → SMTP Settings: turn on custom SMTP** (Resend, Postmark, SES or
   similar). The built-in sender is for testing: it is rate-limited and, on a project like this one,
   only delivers to addresses on your Supabase team, so customers outside your team would never get
   a confirmation email.
5. **Test on a real iPhone** with an address that has no account: sign up, open the email in Gmail
   or Mail, tap the button, tap **Open Invoice Them** if the app doesn't open by itself. Repeat for
   Forgot Password.

## Things to know

- A sign-up with an address that already has an account sends **no email** (Supabase does this on
  purpose). The app now says so and offers Sign In or Reset Password.
- Each link works once. After the app verifies it, a second tap shows "This link was already used
  or has expired".
