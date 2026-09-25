# Invoice Them: launch video

A 32-second vertical (1080×1920, 30 fps) launch film for Reels, TikTok and Shorts, built with
[Remotion](https://www.remotion.dev). The app screens are rebuilt in code from the app's own dark-mode
design tokens, and the soundtrack and sound effects are synthesized by `scripts/make-music.mjs`,
so the video contains no licensed material and can be posted anywhere.

This is a standalone project. The app's TypeScript, ESLint, Jest and Metro configs ignore
`marketing/`.

## Commands

Run these inside `marketing/launch-video`:

```console
npm install
npm run dev
npm run render
```

- **`npm run dev`** regenerates the audio, then opens Remotion Studio for a live preview and
  editing. Each scene is also a separate composition in the Scenes folder.
- **`npm run render`** writes `out/InvoiceThem-Launch-9x16.mp4`.
- **`npm run music`** regenerates `public/audio/*.wav` only.

## Storyboard

Everything is cut to the music: 120 BPM, one beat = 15 frames, one bar = 60 frames. The timing
lives in `src/timing.ts`.

| Time | Scene | Music |
| --- | --- | --- |
| 0–4 s | Hook: "Still making invoices in spreadsheets?", which gets struck out, then "There's a better way." | Filtered intro and riser |
| 4–6 s | Logo reveal: flash, shake, shockwave | Drop |
| 6–10 s | Summary: Outstanding counts up, tiles, chart | Groove |
| 10–14 s | Create: three taps add line items; totals add up | |
| 14–16 s | Sign: the signature draws itself | |
| 16–20 s | Share: the PDF flies out, the share sheet sends it | |
| 20–22 s | Paid: the status flips to Paid, confetti | |
| 22–26 s | Feature montage, one per beat | Breakdown and build |
| 26–32 s | End card: "Now on the App Store" | Final drop and outro hit |

## Editing

| What | Where |
| --- | --- |
| Text | The scene files in `src/scenes/` |
| Colors | `src/theme.ts`, which mirrors the app's `src/lib/theme.ts` |
| App mockups | `src/screens/Screens.tsx` |
| App mark | `AppMark` in `src/components/Bits.tsx` |

`AppMark` is a placeholder. Swap in the real icon when it exists: put the PNG in `public/`,
then use `<Img src={staticFile('icon.png')} />`.

## License note

Remotion is free for individuals and companies with up to 3 people; larger companies need a
[company license](https://www.remotion.pro/license). Inter is used under the SIL Open Font License.
