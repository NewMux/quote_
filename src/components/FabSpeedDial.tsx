import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND } from '../lib/theme';

export interface FabAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface FabSpeedDialProps {
  actions: FabAction[];
  onClose: () => void;
}

const CIRCLE_SIZE = 56;
const RADIUS = 100;
const ARC_START_DEG = 165;
const ARC_END_DEG = 15;
const ORIGIN_BOTTOM = 100;
const STAGGER_STEP = 0.06;

function actionOffset(index: number, count: number) {
  const angleDeg = count === 1 ? 90 : ARC_START_DEG + ((ARC_END_DEG - ARC_START_DEG) * index) / (count - 1);
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: RADIUS * Math.cos(angleRad), y: -RADIUS * Math.sin(angleRad) };
}

export function FabSpeedDial({ actions, onClose }: FabSpeedDialProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [anim]);

  const backdropOpacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.45, 0.45] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#0F1716', opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <View style={styles.origin} pointerEvents="box-none">
        {actions.map((action, index) => {
          const { x, y } = actionOffset(index, actions.length);
          const delay = index * STAGGER_STEP + 0.001;
          const progress = anim.interpolate({ inputRange: [0, delay, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' });
          const translateX = anim.interpolate({ inputRange: [0, delay, 1], outputRange: [0, 0, x], extrapolate: 'clamp' });
          const translateY = anim.interpolate({ inputRange: [0, delay, 1], outputRange: [0, 0, y], extrapolate: 'clamp' });
          return (
            <Animated.View
              key={action.label}
              style={[
                styles.buttonWrap,
                { opacity: progress, transform: [{ translateX }, { translateY }, { scale: progress }] },
              ]}
            >
              <Pressable
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
                accessibilityLabel={action.label}
                style={styles.circle}
              >
                <Ionicons name={action.icon} size={22} color="white" />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  origin: {
    position: 'absolute',
    bottom: ORIGIN_BOTTOM,
    left: 0,
    right: 0,
    height: 0,
  },
  buttonWrap: {
    position: 'absolute',
    left: '50%',
    top: -CIRCLE_SIZE / 2,
    marginLeft: -CIRCLE_SIZE / 2,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: BRAND.default,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
