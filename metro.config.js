const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Native-only modules have no web build; the web shell (used by the scripted checks in scripts/) gets the same stubs
// the tests use, so the app bundles in a browser. Native builds are untouched.
const WEB_STUBS = {
  'react-native-google-mobile-ads': path.join(__dirname, 'test', 'googleMobileAdsStub.ts'),
  'react-native-purchases': path.join(__dirname, 'test', 'purchasesStub.ts'),
};
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_STUBS[moduleName]) return { type: 'sourceFile', filePath: WEB_STUBS[moduleName] };
  return resolveRequest ? resolveRequest(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
