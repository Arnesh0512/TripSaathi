import { Platform } from 'react-native';

/**
 * Universal googleAuth entry point.
 * Metro bundler automatically resolves googleAuth.web.js on Web and googleAuth.native.js on Android/iOS.
 * This file serves as a fallback dispatcher for environments where platform extension resolution is disabled.
 */

let impl;
if (Platform.OS === 'web') {
  impl = require('./googleAuth.web');
} else {
  impl = require('./googleAuth.native');
}

export const isNativeGoogleSignInSupported = impl.isNativeGoogleSignInSupported;
export const configureGoogleSignIn = impl.configureGoogleSignIn;
export const initWebGoogleSignIn = impl.initWebGoogleSignIn;
export const signInWithGoogle = impl.signInWithGoogle;
export const signOutFromGoogle = impl.signOutFromGoogle;
