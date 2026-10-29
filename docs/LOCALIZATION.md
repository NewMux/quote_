# Localization

Invoice Them speaks English and Arabic. Arabic runs right to left. The app follows the device's language, and iOS lets a person set a different language for one app (Settings → Invoice Them → Language).

## How it works

- `src/lib/i18n/index.ts` has `t()` and `tp()`. The English text is the lookup key, so a string with no translation shows in English instead of a key.
- `src/lib/i18n/ar.ts` holds the Arabic translations.
- The language is read once, when the app starts. iOS restarts an app when its language changes, so nothing has to react to a change while it runs. That is also why module-level constants such as `FREQUENCY_OPTIONS` can call `t()` safely.
- The layout direction comes from React Native (`I18nManager.isRTL`), which iOS sets from the app's language. `expo-localization` in `app.json` lists the supported languages (`en`, `ar`) and allows RTL.
- `locales/ar.json` is the Arabic text of the permission prompts (Contacts, Photos) and the home-screen name.
- Dates use the `date-fns` locale through `dateLocale()` and `datePattern()` in `src/lib/i18n/dates.ts`. Numbers and currency stay in Western digits (`1,200.00`), so amounts read the same in the app, in PDFs and in messages.
- The invoice PDF follows the app's language, with `dir="rtl"` in Arabic (`src/lib/pdf/htmlTemplate.ts`).

## Writing a string

```ts
t('Save')                                   // plain text
t('Delete {number}?', { number: doc.doc_number })   // placeholders are {name}
tp(count, '{count} invoice', '{count} invoices')    // singular, plural; {count} is filled in
```

- Pass the whole sentence, not pieces joined in code, so a translator can reorder the words.
- Don't put a document type or a status into the middle of a sentence. Give each case its own string, because Arabic changes the words around it.
- For plurals, add an object with the `zero`, `one`, `two`, `few`, `many` and `other` forms to `ar.ts` under the English plural form. `i18n.test.ts` checks that every form is there.

`npx jest src/lib/i18n` fails when a `t()` string has no Arabic entry, when a translation drops a `{placeholder}`, or when `ar.ts` keeps a string the app no longer uses.

## Layout in right-to-left

- React Native swaps `left` and `right` styles in RTL on its own, so `pl-4`, `marginLeft` and `left-0` already mean "start". Don't add per-side code for RTL.
- Text that must align to the end uses `isRTL()` (see `ListRow`'s value column), because `text-right` is always the physical right.
- The `chevron.right` icon is mirrored in `Icon.tsx`.
- The charts and the welcome pager keep a left-to-right direction on purpose: their scroll offsets and time axis don't mirror cleanly. Each welcome page still lays out in the language's own direction.

## Adding another language

1. Add the code to `Locale` and `detectLocale()` in `src/lib/i18n/index.ts`, with a dictionary file next to `ar.ts`.
2. Add the `date-fns` locale in `dates.ts`.
3. Add the code to `supportedLocales` in `app.json`, and `locales/<code>.json` for the permission prompts.
4. Extend `i18n.test.ts` to cover the new dictionary.
