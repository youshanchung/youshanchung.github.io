// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Some packages (e.g. zustand) ship an ESM build that references
// `import.meta`, which is only valid inside a real ES module. Metro's web
// export loads its bundle via a plain <script> tag (not type="module"),
// so if package-exports resolution picks that ESM build, the whole bundle
// fails to parse in the browser with:
//   "Cannot use 'import.meta' outside a module"
// Disabling package-exports resolution makes Metro fall back to each
// package's plain `main` field (CommonJS), which doesn't have this issue.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
