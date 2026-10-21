# Invoice Them: launch videos

Vertical (1080×1920, 30 fps) videos for Reels, TikTok and Shorts, built with
[Remotion](https://www.remotion.dev).

- **v2, current (`LaunchVideo`, 45.6 s):** a light, multicolor look with a midnight finale,
  calmer pacing and the newest features. It renders to `out/InvoiceThem-Launch-v2-9x16.mp4`.
- **"What separates the pros" (`Pros`, 20 s):** a motivational-edit style spot (black frame,
  footage in a band, word-by-word subtitles) with a voiceover over the song from the Bond reference
  edit, which dips under each line. It renders to `out/InvoiceThem-Pros-9x16.mp4`.
  `ProsVoiceOnly` leaves the music out, for adding a sound in TikTok instead.
- **15 s ad (`Ad15`, 14.4 s):** a paid-social cutdown of v2 with a voiceover. It renders to
  `out/InvoiceThem-Ad-15s-9x16.mp4`.
- **v1 (`LaunchVideoV1`, 32 s):** the fast, dark, teal edit. It renders to
  `out/InvoiceThem-Launch-9x16.mp4`.

The app screens are rebuilt in code from the app's own design tokens. The soundtracks and sound
effects are synthesized by `scripts/make-music*.mjs`, so the videos contain no licensed material
and can be posted anywhere. The ad's voiceover, `public/vo/ad-voiceover.mp3`, was generated with
ElevenLabs (voice "Justin Case", model `eleven_v4`).

- **App Store screenshots (`Store1Create` … `Store6More`):** six 1320×2868 stills (iPhone 6.9", the
  size App Store Connect asks for; it scales down to the smaller iPhones, and the app is
  iPhone-only). `npm run render:store` writes them to `out/appstore/` as opaque RGB PNGs, plus
  `preview-strip.png`, all six side by side for sharing (not an upload). They reuse the v2 phone
  mockups, frozen at their best frame. The copy lives in `src/store/shots.tsx` and the layout in
  `src/store/layout.tsx`.

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
- **`npm run render`** renders v2, **`npm run render:ad`** renders the 15 s ad, and
  **`npm run render:v1`** renders v1.

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

## "Pros" edit

Everything lives in `src/pros/`. `timing.ts` holds the cut (`SHOTS`) and the script, with
each word's onset in the voiceover. The subtitles appear word by word from those onsets.
`public/pros/voiceover.mp3` is ElevenLabs (voice "Marcus – Powerful Motivational Narrator",
`eleven_v4`), loudness-normalized to -14 LUFS.

Footage: every shot is cut from the four TikTok reference edits (Ocean's, two "ADVANCE"
edits, Bond). Run this once before rendering:

```console
scripts/prep-pros-footage.sh oceans.mp4 advance-1.mp4 advance-2.mp4 bond.mp4
```

The script trims each moment and crops it to the band, keeping each TikTok watermark and
"ADVANCE" mark out of frame. It slows the shortest moments with motion interpolation. Video 4's
caption covers the middle of every frame, so the script blurs that block and the subtitles sit on
top of it. It also builds `public/pros/music.wav`, the song from the Bond edit. Only 12.2 s of
the song is in that clip, so one 7.22 s phrase repeats at the closest-matching seam, which
stretches it to 19.5 s. The clips and the music are third-party material and stay out of Git.

```console
npx remotion render Pros out/InvoiceThem-Pros-9x16.mp4 --codec=h264 --crf=17 --audio-codec=aac --audio-bitrate=256k
```

## 15 s ad storyboard

The ad uses the same 100 BPM grid, cut on beats (one beat is 18 frames). Its timing and voiceover
cues live in `src/ad/timing.ts`.

| Time | Scene | Voiceover |
| --- | --- | --- |
| 0–3 s | The spreadsheet hook, sped up | "Still invoicing in spreadsheets?" |
| 3–5.4 s | Three line items added | "Create an invoice in seconds." |
| 5.4–7.8 s | Signature drawn, "Signed" | "Get it signed on the spot." |
| 7.8–10.2 s | The client scans the PDF's QR code and pays | "Your client scans… and pays." |
| 10.2–14.4 s | Midnight end card: "Get it on the App Store" · "Try it free for a week" | "Invoice Them. Try it free on the App Store." |

The voiceover is a single take. `VO` in `src/ad/timing.ts` trims each line out of it at the take's
pauses and places it in its scene, and the music dips under each line. To re-record, replace the
MP3, then update each line's `from`/`to` frames. Find the pauses with
`ffmpeg -i public/vo/ad-voiceover.mp3 -af silencedetect=n=-40dB:d=0.18 -f null -`.

## Editing

| What | v2 | v1 |
| --- | --- | --- |
| Text | `src/v2/scenes/` (ad: `src/ad/scenes.tsx`) | `src/scenes/` |
| Colors | `src/v2/theme.ts` | `src/theme.ts` |
| App mockups | `src/v2/screens.tsx` (light mode) | `src/screens/Screens.tsx` |
| App mark | `AppMark` in `src/components/Bits.tsx` | same |

`AppMark` is the real app icon: the lime mark on a Midnight Ink squircle. The identity lives in
`src/brand.ts` (colors, typeface, tagline) and `public/brand/` (mark and wordmark as SVG, cut
from the "Invoice Them Logo Identity" PDF). The brand typeface, Bricolage Grotesque, is bundled
in `public/fonts`.

## License note

Remotion is free for individuals and companies with up to 3 people; larger companies need a
[company license](https://www.remotion.pro/license). Inter is used under the SIL Open Font License.
