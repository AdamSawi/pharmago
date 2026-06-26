const darkColors = {
  bg: {
    deep: '#08090c',
    surface: '#101319',
    card: 'rgba(255,255,255,0.05)',
    cardStrong: 'rgba(255,255,255,0.08)',
  },
  border: {
    glass: 'rgba(255,255,255,0.09)',
    glassStrong: 'rgba(255,255,255,0.18)',
  },
  amber: '#eba24e',
  amberBright: '#ffc06e',
  amberSoft: 'rgba(235,162,78,0.14)',
  sage: '#7fb89e',
  sageBright: '#8fe0b8',
  sageSoft: 'rgba(127,184,158,0.14)',
  violet: '#9b8fd4',
  violetBright: '#a78bfa',
  violetSoft: 'rgba(155,143,212,0.14)',
  red: '#e07a6b',
  redSoft: 'rgba(224,122,107,0.12)',
  redBorder: 'rgba(224,122,107,0.25)',
  text: {
    primary: '#f7f3ec',
    secondary: 'rgba(247,243,236,0.6)',
    tertiary: 'rgba(247,243,236,0.36)',
  },
} as const;

// Same warm brand palette, re-balanced for light backgrounds: neutrals flip
// from near-black to a warm off-white (matching the logo kit's "fond clair"
// variant, #f5f2ed), while accent colors that double as text (amber/sage/
// violet/red) are deepened so they keep AA-ish contrast on a light surface.
const lightColors = {
  bg: {
    deep: '#fdfbf7',
    surface: '#f4f0e9',
    card: 'rgba(26,20,16,0.04)',
    cardStrong: 'rgba(26,20,16,0.07)',
  },
  border: {
    glass: 'rgba(26,20,16,0.08)',
    glassStrong: 'rgba(26,20,16,0.16)',
  },
  amber: '#b8731a',
  amberBright: '#c9821f',
  amberSoft: 'rgba(201,130,31,0.14)',
  sage: '#3d7a60',
  sageBright: '#2f6b52',
  sageSoft: 'rgba(61,122,96,0.13)',
  violet: '#6f5fc4',
  violetBright: '#5b4bb8',
  violetSoft: 'rgba(111,95,196,0.13)',
  red: '#c0463a',
  redSoft: 'rgba(192,70,58,0.10)',
  redBorder: 'rgba(192,70,58,0.25)',
  text: {
    primary: '#1a1410',
    secondary: 'rgba(26,20,16,0.62)',
    tertiary: 'rgba(26,20,16,0.4)',
  },
} as const;

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bg: { deep: string; surface: string; card: string; cardStrong: string };
  border: { glass: string; glassStrong: string };
  amber: string;
  amberBright: string;
  amberSoft: string;
  sage: string;
  sageBright: string;
  sageSoft: string;
  violet: string;
  violetBright: string;
  violetSoft: string;
  red: string;
  redSoft: string;
  redBorder: string;
  text: { primary: string; secondary: string; tertiary: string };
}

export const Palettes: Record<ThemeMode, ThemeColors> = {
  dark: darkColors,
  light: lightColors,
};

/** @deprecated Static dark palette kept for components not yet wired to useTheme(). Prefer `const { colors } = useTheme()`. */
export const Colors = darkColors;

export const Radius = {
  xl: 30,
  lg: 22,
  md: 15,
  sm: 10,
  xs: 8,
  pill: 100,
} as const;

export const FontFamily = {
  serif: 'DMSerifDisplay_400Regular',
  serifLight: 'DMSerifDisplay_400Regular',
  serifItalic: 'DMSerifDisplay_400Regular_Italic',
  serifMediumItalic: 'DMSerifDisplay_400Regular_Italic',
  sans: 'Outfit_400Regular',
  sansMedium: 'Outfit_500Medium',
  sansSemiBold: 'Outfit_600SemiBold',
  sansBold: 'Outfit_700Bold',
  sansExtraBold: 'Outfit_800ExtraBold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 32,
  xxxl: 48,
} as const;

export const Shadow = {
  amber: {
    shadowColor: darkColors.amberBright,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
