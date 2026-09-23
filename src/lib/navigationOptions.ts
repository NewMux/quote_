/** Shared native-stack options. Tab roots use iOS large titles, which collapse into the inline
 * title as the screen's root ScrollView/FlatList scrolls (that list must set
 * `contentInsetAdjustmentBehavior="automatic"` for the collapse to track it). */
export const LARGE_TITLE_OPTIONS = {
  headerLargeTitleEnabled: true,
  headerLargeTitleShadowVisible: false,
} as const;
