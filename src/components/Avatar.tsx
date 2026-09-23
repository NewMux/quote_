import { Image, Text, View } from 'react-native';
import { AVATAR_PALETTE } from '../lib/theme';
import { useSignedUrl } from '../lib/useSignedUrl';

interface AvatarProps {
  name: string;
  photoUri?: string | null;
  seed?: string;
  size?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function hashToIndex(value: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

export function Avatar({ name, photoUri, seed, size = 40 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  const signedUrl = useSignedUrl(photoUri);

  if (signedUrl) {
    return <Image source={{ uri: signedUrl }} style={dimension} accessibilityIgnoresInvertColors accessible={false} />;
  }

  const color = AVATAR_PALETTE[hashToIndex(seed ?? name, AVATAR_PALETTE.length)];

  return (
    // Decorative: the name always appears next to the avatar, so VoiceOver skips the initials.
    <View
      style={[dimension, { backgroundColor: color }]}
      className="items-center justify-center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={{ fontSize: size * 0.38 }} className="text-white font-semibold" allowFontScaling={false}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
