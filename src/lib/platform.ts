import { Platform } from 'react-native';

/** iOS 26 or later: the Liquid Glass design, where bar buttons are glass capsules and confirming
 * actions are shown as a checkmark in a prominent tinted circle. */
export const IS_IOS_26 = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;
