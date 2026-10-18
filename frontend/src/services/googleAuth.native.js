import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_CLIENT_ID } from '../constants/theme';

let isConfigured = false;

/**
 * Checks if the native Google Sign-In module is linked and available.
 * (In standard Expo Go, native modules are not linked; standalone APK or Dev Build is required).
 */
export function isNativeGoogleSignInSupported() {
  try {
    return !!GoogleSignin && typeof GoogleSignin.configure === 'function';
  } catch (e) {
    return false;
  }
}

/**
 * Configure Google Sign In on Native Android / iOS.
 * Note: webClientId is the Web OAuth Client ID from Google Cloud Console.
 * Google Play Services uses this webClientId to mint an OpenID Connect ID token
 * with audience matching your backend server's GOOGLE_CLIENT_ID.
 */
export function configureGoogleSignIn() {
  if (isConfigured) return;

  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_CLIENT_ID,
      offlineAccess: false,
    });
    isConfigured = true;
  } catch (error) {
    console.warn('[TripSaathi Native Auth] GoogleSignin configure error:', error);
  }
}

/**
 * Native no-op for web button initialization.
 */
export function initWebGoogleSignIn() {
  // Web-only helper
}

/**
 * Initiate Native Google Sign-In.
 * Returns an object:
 *  - { success: true, idToken: '...' } on success
 *  - { cancelled: true } if the user dismissed the account chooser
 *  - { inProgress: true } if a sign-in operation is already underway
 *  - { error: '...' } with a user-facing explanation on failure
 */
export async function signInWithGoogle() {
  try {
    configureGoogleSignIn();

    // Check Google Play Services availability and prompt user if outdated
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Perform Google Sign-In
    const response = await GoogleSignin.signIn();

    // Handle cancellation response (v16+ returns type: 'cancelled')
    if (response && response.type === 'cancelled') {
      return { cancelled: true };
    }

    // Extract ID token (supports v16 response.data.idToken as well as legacy response.idToken)
    const idToken = response?.data?.idToken || response?.idToken;

    if (!idToken) {
      return {
        error:
          'No ID token returned by Google Sign-In. Verify that the Web Client ID is configured in Google Cloud Console.',
      };
    }

    return {
      success: true,
      idToken,
      user: response?.data?.user || response?.user,
    };
  } catch (error) {
    console.warn('[TripSaathi Native Auth] Sign-in error details:', error);

    // Handle specific status codes
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { cancelled: true };
    }

    if (error.code === statusCodes.IN_PROGRESS) {
      return { inProgress: true };
    }

    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        error:
          'Google Play Services is not available or outdated on this device. Please update Google Play Services in the Play Store.',
      };
    }

    // Friendly error when tested in standard Expo Go instead of standalone APK
    const errMsg = String(error.message || '');
    if (errMsg.includes('RNGoogleSignin') || errMsg.includes('null') || errMsg.includes('TurboModule')) {
      return {
        error:
          'Native Google Sign-In requires a standalone build (APK) or EAS development build. To test on Android, install the preview APK built with EAS, or use the "⚡ One-Tap Fast Developer Sign In" button during Expo Go development.',
      };
    }

    return {
      error: error.message || 'Google Sign-In failed. Please try again.',
    };
  }
}

/**
 * Sign out from Google on native device.
 * Clears cached Google account selection so the account picker appears next time.
 */
export async function signOutFromGoogle() {
  try {
    configureGoogleSignIn();
    await GoogleSignin.signOut();
  } catch (error) {
    console.warn('[TripSaathi Native Auth] Google sign-out warning:', error);
  }
}
