import { GOOGLE_CLIENT_ID } from '../constants/theme';

/**
 * Web Google Identity Services (GSI) Implementation
 * Preserves the working web authentication flow using https://accounts.google.com/gsi/client.
 */

export function isNativeGoogleSignInSupported() {
  return false;
}

export function configureGoogleSignIn() {
  // No native configuration needed on web
}

export function initWebGoogleSignIn(onSuccess, onError) {
  if (typeof window === 'undefined') return;

  const scriptId = 'google-gsi-script';

  const setupGsi = () => {
    try {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response && response.credential) {
              onSuccess({
                success: true,
                idToken: response.credential,
              });
            } else {
              onError?.('No credential returned from Google Identity Services.');
            }
          },
        });

        const btnParent = document.getElementById('googleSignInBtn');
        if (btnParent) {
          btnParent.innerHTML = '';
          window.google.accounts.id.renderButton(btnParent, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: 260,
          });
        }
      }
    } catch (err) {
      console.warn('[TripSaathi Web Auth] GSI initialization error:', err);
      onError?.(err.message || 'Failed to initialize Google Sign In');
    }
  };

  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = setupGsi;
    script.onerror = () => {
      console.warn('[TripSaathi Web Auth] Failed to load Google GSI script.');
      onError?.('Could not load Google Sign In script. Check internet connection or ad-blocker.');
    };
    document.body.appendChild(script);
  } else {
    setupGsi();
  }
}

export async function signInWithGoogle() {
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    try {
      window.google.accounts.id.prompt();
      return { inProgress: true };
    } catch (e) {
      return { error: e.message || 'Google Sign In prompt error' };
    }
  }
  return { error: 'Google Identity Services Web SDK not ready' };
}

export async function signOutFromGoogle() {
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    try {
      window.google.accounts.id.disableAutoSelect?.();
    } catch (e) {
      console.warn('[TripSaathi Web Auth] Sign out error:', e);
    }
  }
}
