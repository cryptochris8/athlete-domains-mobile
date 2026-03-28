import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.athletedomains.ios',
  appName: 'Athlete Domains',
  webDir: 'dist',
  server: {
    // For local dev on a Mac, uncomment to point at Vite dev server:
    // url: 'http://YOUR_MAC_IP:5173',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    preferredContentMode: 'mobile',
    scrollEnabled: false,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1A1A2E',
      overlaysWebView: true,
    },
    SplashScreen: {
      launchAutoHide: false,
      showSpinner: false,
      backgroundColor: '#1A1A2E',
    },
    Keyboard: {
      resize: 'none',
    },
  },
};

export default config;
