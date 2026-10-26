# iPhone Duo

Apple announced the iPhone Duo (its first foldable: a 5.4" outer display that opens to a 7.6" inner
display, iOS 27) on September 9, 2026; it went on sale October 23. Sources: Apple's Tech Talk
[Prepare your app for iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111461/) and the
Expo notes linked below. None of this has been tested on a Duo or in Xcode 27's simulator.

## Where the app stands

**The app already runs on the Duo, with no rebuild.** Apple says an app built with an older SDK
works as is: closed, it uses the outer display (to the left of the status bar and camera); open, it
appears at a familiar iPhone size and aspect ratio. So nothing here blocks 1.0.2.

To *fill* the inner display, the app has to be built with the iOS 27 SDK (iOS 27.1 to reach the
screen edge). That is a separate release, for these reasons:

1. **Launch-crash trap on SDK 57.** iOS 27 requires UIKit's scene lifecycle. An Expo SDK 57 app built
   with the iOS 27 SDK and without scene support passes the build and App Review, then **crashes at
   launch on iOS 27** ([expo/expo#46664](https://github.com/expo/expo/issues/46664),
   [docs PR #51942](https://github.com/expo/expo/pull/51942)). Fix on SDK 57: `expo` 57.0.23+ and
   `expo-build-properties` 57.0.20+ with `ios.enableSceneSupport: true`. SDK 58 includes it by
   default, so **upgrading to SDK 58 is the cleaner route.**
2. **EAS's `latest` image is `macos-tahoe-26.6-xcode-27.1`.** Don't set `"image": "latest"` in
   `eas.json` on SDK 57. The default (`auto`, which picks the image for the SDK) is what to keep.
   After each build, open it on expo.dev and check the **Image** field: it should not say
   `xcode-27` unless scene support is enabled.
3. It needs testing in Xcode 27.1's Device Hub (open, closed, rotated, Split View). Nothing here can
   be verified without it.

## Done in this change (safe on phones: no change below 720 pt wide)

- `src/lib/layout.ts`: `contentColumn` caps scrolling content at 720 pt and centers it. Applied to the
  tab roots (Summary, Documents, Clients), document and client detail, Settings screens, new
  document, and `FormScrollView`, so lists and forms stay a readable column on a wide window.
- `LineChart` draws at the width it is given instead of a fixed 320 pt.

Already capped before: paywall (560), onboarding (480), sign-in and sign-up (440), privacy policy (680).

## Plan for the Duo release (1.1)

1. Upgrade to Expo SDK 58 (scene lifecycle by default), then build on the Xcode 27.1 image.
2. Test in Device Hub: Summary, Documents, document detail, signing sheet, paywall, on the outer
   display, the inner display, and in Split View on both sides. Look for stretched rows, clipped
   sheets and asymmetric safe areas.
3. Decide on the inner display's navigation: the system tab bar adapts by itself; a sidebar or a
   two-column Documents list (list and detail side by side) would use the extra width. Not built.
4. Orientation: `app.json` locks portrait. Apple suggests allowing landscape (people stand the
   device up like a tent). Only do that after checking the forms and sheets in landscape.
5. App Store: add iPhone Duo screenshots if App Store Connect asks for a new size.
