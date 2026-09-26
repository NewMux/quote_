# Invoice Them: launch videos

Two vertical (1080×1920, 30 fps) launch films for Reels, TikTok and Shorts, built with
[Remotion](https://www.remotion.dev).

- **v2, current (`LaunchVideo`, 45.6 s):** a light, multicolor look with a midnight finale,
  calmer pacing and the newest features. It renders to `out/InvoiceThem-Launch-v2-9x16.mp4`.
- **v1 (`LaunchVideoV1`, 32 s):** the fast, dark, teal edit. It renders to
  `out/InvoiceThem-Launch-9x16.mp4`.

The app screens are rebuilt in code from the app's own design tokens. The soundtracks and sound
effects are synthesized by `scripts/make-music*.mjs`, so the videos contain no licensed material
and can be posted anywhere.

This is a standalone project. The app's TypeScript, ESLint, Jest and Metro configs ignore
`marketing/`.

## Commands

Run these inside `marketing/launch-video`:

```console
npm install
npm run dev
npm run render
npm run render:v1
```

- **`npm run dev`** regenerates the audio, then opens Remotion Studio for a live preview and
  editing. Each scene is also its own composition, in the v2-Scenes and v1-Scenes folders.
- **`npm run render`** renders v2, and **`npm run render:v1`** renders v1.

## v2 storyboard

The video runs at 100 BPM: one bar is 72 frames (2.4 s). The timing lives in `src/v2/timing.ts`.
Every headline holds for at least 2.4 s.

| Time | Scene | Color |
| --- | --- | --- |
| 0–4.8 s | "Still invoicing in spreadsheets?": a glitchy spreadsheet falls apart | red |
| 4.8–7.2 s | App mark, "Invoice Them", "Invoices, made simple." | violet |
| 7.2–12 s | Create an invoice in seconds | blue |
| 12–16.8 s | Add clients from your contacts | orange |
| 16.8–21.6 s | Signed on the spot, then the signature large on the PDF | violet |
| 21.6–26.4 s | Every invoice has a pay link: the client scans the QR code and pays | pink |
| 26.4–31.2 s | Payment received; Issued → Paid; the month's total grows | indigo |
| 31.2–36 s | Bento grid of more features | multicolor |
| 36–38.4 s | Circle wipe to midnight: "Everything you need to get paid." | |
| 38.4–45.6 s | End card: "Now on the App Store" · "Try it free for a week" | midnight |

## Editing

| What | v2 | v1 |
| --- | --- | --- |
| Text | `src/v2/scenes/` | `src/scenes/` |
| Colors | `src/v2/theme.ts` | `src/theme.ts` |
| App mockups | `src/v2/screens.tsx` (light mode) | `src/screens/Screens.tsx` |
| App mark | `AppMark` in `src/components/Bits.tsx` | same |

`AppMark` is a placeholder. Swap in the real icon when it exists: put the PNG in `public/`,
then use `<Img src={staticFile('icon.png')} />`.

## License note

Remotion is free for individuals and companies with up to 3 people; larger companies need a
[company license](https://www.remotion.pro/license). Inter is used under the SIL Open Font License.
