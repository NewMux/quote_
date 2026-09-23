import glyphMap from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json';
import { SYMBOL_FALLBACKS } from './symbols';

describe('SYMBOL_FALLBACKS', () => {
  it('maps every SF Symbol to a real Ionicons glyph', () => {
    const missing = Object.values(SYMBOL_FALLBACKS).filter((name) => !(name in glyphMap));
    expect(missing).toEqual([]);
  });

  it('uses dotted SF Symbol names as keys', () => {
    for (const key of Object.keys(SYMBOL_FALLBACKS)) {
      expect(key).toMatch(/^[a-z0-9]+(\.[a-z0-9]+)*$/);
    }
  });
});
