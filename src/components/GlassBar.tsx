import type { ReactNode } from 'react';
import { View } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

const HAS_GLASS = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

/** A floating bottom bar for a screen's main call to action. On iOS 26 it's a Liquid Glass capsule
 * that content scrolls beneath; elsewhere, a translucent card with a hairline border. Only for
 * screens without a tab bar (the tab bar owns that edge otherwise). */
export function GlassBar({ children }: { children: ReactNode }) {
  const shape = { borderRadius: 34, borderCurve: 'continuous' as const };
  if (HAS_GLASS) {
    return (
      <GlassView glassEffectStyle="regular" style={[shape, { padding: 8, gap: 4 }]}>
        {children}
      </GlassView>
    );
  }
  return (
    <View className="bg-card/95 border border-separator" style={[shape, { padding: 8, gap: 4 }]}>
      {children}
    </View>
  );
}
