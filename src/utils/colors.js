/**
 * Color manipulation utilities
 * @module utils/colors
 */

/**
 * Parse hex color to RGB components
 * @param {string} hex - Hex color string (e.g., '#3b82f6')
 * @returns {{r: number, g: number, b: number}} RGB components (0-255)
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB components to hex color
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color string
 */
export function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Mix two colors together
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @param {number} ratio - Mix ratio (0 = all color1, 1 = all color2)
 * @returns {string} Mixed hex color
 */
export function mixColors(color1, color2, ratio) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

  return rgbToHex(r, g, b);
}

/**
 * Add alpha channel to hex color
 * @param {string} hex - Hex color string
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
export function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Lighten a color
 * @param {string} hex - Hex color string
 * @param {number} amount - Amount to lighten (0-1)
 * @returns {string} Lightened hex color
 */
export function lighten(hex, amount) {
  return mixColors(hex, '#ffffff', amount);
}

/**
 * Darken a color
 * @param {string} hex - Hex color string
 * @param {number} amount - Amount to darken (0-1)
 * @returns {string} Darkened hex color
 */
export function darken(hex, amount) {
  return mixColors(hex, '#000000', amount);
}

/**
 * Create a color gradient array for Mapbox expressions
 * @param {string} startColor - Start hex color
 * @param {string} endColor - End hex color
 * @param {number} steps - Number of gradient steps
 * @returns {string[]} Array of hex colors
 */
export function createGradient(startColor, endColor, steps) {
  const colors = [];
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    colors.push(mixColors(startColor, endColor, ratio));
  }
  return colors;
}

/**
 * Check if a color is dark (for contrast calculations)
 * @param {string} hex - Hex color string
 * @returns {boolean} True if color is dark
 */
export function isDark(hex) {
  const { r, g, b } = hexToRgb(hex);
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}
