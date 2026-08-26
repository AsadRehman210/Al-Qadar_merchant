// Generates a Tailwind-style 50-950 tint/shade ramp from a single tenant
// brand color, so the whole app's existing teal-* utility classes (already
// used everywhere) can be repainted at runtime by overriding the CSS
// variables Tailwind v4 generates for them — see theme.css's own hardcoded
// #3643AB ramp for the build-time default, and ThemeApplier for the
// runtime override once a tenant's own themeColor is known.
const SHADE_LIGHTNESS = {
  50: 97,
  100: 93,
  200: 85,
  300: 74,
  400: 60,
  500: null, // the base color itself, unmodified
  600: 36,
  700: 30,
  800: 25,
  900: 20,
  950: 12,
};

const hexToRgb = (hex) => {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
};

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;
  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToRgb = (h, s, l) => {
  h /= 360;
  s /= 100;
  l /= 100;
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const rgbToHex = (r, g, b) => `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;

export const generateColorRamp = (baseHex) => {
  const { r, g, b } = hexToRgb(baseHex);
  const { h, s } = rgbToHsl(r, g, b);
  const ramp = {};
  for (const [shade, targetL] of Object.entries(SHADE_LIGHTNESS)) {
    if (targetL === null) {
      ramp[shade] = baseHex.toUpperCase();
      continue;
    }
    // Lighter tints read as slightly washed-out at full saturation — dialed
    // back a touch, same way Tailwind's own stock ramps taper at the light end.
    const satAdj = Number(shade) < 500 ? Math.min(100, s * 0.9) : s;
    const { r: rr, g: gg, b: bb } = hslToRgb(h, satAdj, targetL);
    ramp[shade] = rgbToHex(rr, gg, bb).toUpperCase();
  }
  return ramp;
};

export const DEFAULT_THEME_COLOR = "#3643AB";
