import { Platform } from 'react-native';

export const THEME = {
  bg: '#FAF6F0',                 // Warm cream / ivory canvas
  bgAlt: '#F3EDE4',              // Secondary warm cream
  paper: '#FFFFFF',              // Pure white paper card
  paperSubtle: '#FAF7F2',        // Soft cream tint
  border: '#E5DFD5',             // Warm delicate hairline border
  borderDark: '#D6CFC3',         // Structured border
  
  primary: '#A83827',            // Burnt terracotta / brick red
  primaryHover: '#8E2E1F',       // Deep terracotta
  primaryLight: 'rgba(168, 56, 39, 0.08)',
  primaryBorder: 'rgba(168, 56, 39, 0.25)',
  
  text: '#1E1B18',               // Deep charcoal / espresso
  textSecondary: '#6E675F',      // Warm slate / stone
  textMuted: '#9B9389',          // Muted taupe
  
  green: '#2E6F40',              // Sage green (On Time / Confirmed / Low)
  greenBg: 'rgba(46, 111, 64, 0.1)',
  
  amber: '#C25E1A',              // Burnt ochre (At Risk / Medium)
  amberBg: 'rgba(194, 94, 26, 0.1)',
};

export const SERIF_FONT = Platform.select({
  web: "'Playfair Display', Georgia, 'Times New Roman', serif",
  default: 'serif',
});

export const GOOGLE_CLIENT_ID = '258416843143-ahnf9rasq8blnra0gcq7rr5cn77s9qsd.apps.googleusercontent.com';
export const DEV_MACHINE_IP = '192.168.1.11';
