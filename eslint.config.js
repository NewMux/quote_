const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    // supabase/functions runs on Supabase's own Deno runtime, not through this app's
    // Metro/TypeScript project (see tsconfig.json's exclude for the same reason).
    ignores: ['dist/**', '.expo/**', 'node_modules/**', 'supabase/functions/**'],
  },
  expoConfig,
  {
    rules: {
      // eslint-plugin-react-hooks v7's newer, React Compiler-oriented rules. Both flag
      // completely standard, correct React Native patterns this codebase relies on
      // throughout: useRef(new Animated.Value(...)).current for the Animated API (refs),
      // and syncing external/async state into component state inside a useEffect
      // (set-state-in-effect, e.g. auth session loading, resolving a signed Storage URL).
      // Rewriting those to satisfy these rules would make the code worse, not better.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
