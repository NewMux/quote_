import type { ViewStyle } from 'react-native';

/** The widest the content of a scrolling screen gets. On a phone this changes nothing (phones are
 * narrower), but on a wide window, like the iPhone Duo's open inner display, lists and forms stay
 * a readable column instead of stretching edge to edge. Add it first in a ScrollView's or list's
 * `contentContainerStyle`: `contentContainerStyle={[contentColumn, { padding: 16 }]}`. */
export const CONTENT_MAX_WIDTH = 720;

export const contentColumn: ViewStyle = { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' };
