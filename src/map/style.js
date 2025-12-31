/**
 * Map style management
 * @module map/style
 */

import { TIMING, MAP_STYLES } from '../config/constants.js';
import { getMap, getGeoJSON } from '../state/store.js';
import { loadMarkerIcons } from '../utils/icons.js';
import { rebuildForMode } from '../layers/index.js';
import { reapply3DFeatures } from './threeD.js';

/**
 * Build a Mapbox style URL from a style identifier
 * @param {string} style - Style identifier (e.g., 'dark-v11' or 'username/styleId')
 * @returns {string} Full Mapbox style URL
 */
export function buildStyleUrl(style) {
  if (style === 'standard') {
    return 'mapbox://styles/mapbox/standard';
  }

  if (style.includes('/')) {
    // Custom style with username/styleId format
    return `mapbox://styles/${style}`;
  }

  // Standard Mapbox style
  return `mapbox://styles/mapbox/${style}`;
}

/**
 * Check if a style is a dark theme
 * @param {string} style - Style identifier
 * @returns {boolean}
 */
export function isDarkStyle(style) {
  const darkStyles = [
    MAP_STYLES.CYBER,
    MAP_STYLES.DARK,
    MAP_STYLES.SATELLITE
  ];

  return darkStyles.includes(style) || style.includes('dark') || style.includes('satellite');
}

/**
 * Change the map style
 * @param {string} style - Style identifier
 * @param {mapboxgl.Map} [map]
 */
export function changeStyle(style, map = getMap()) {
  if (!map) return;

  const styleUrl = buildStyleUrl(style);
  map.setStyle(styleUrl);

  // Wait for style to fully load before rebuilding
  map.once('idle', () => {
    handleStyleLoaded(map);
  });
}

/**
 * Handle style load completion - reload icons and rebuild layers
 * @param {mapboxgl.Map} map
 */
async function handleStyleLoaded(map) {
  try {
    // Reload custom icons (cleared on style change)
    await loadMarkerIcons(map);

    // Small delay to ensure icons are fully loaded
    setTimeout(() => {
      if (getGeoJSON()) {
        rebuildForMode(map);
      }

      // Re-apply 3D features if enabled
      reapply3DFeatures(map);
    }, TIMING.STYLE_LOAD_BUFFER_MS);

  } catch (error) {
    console.error('Error handling style load:', error);
  }
}

/**
 * Handle style change from UI dropdown
 */
export function handleStyleChange() {
  const select = document.getElementById('mapStyle');
  if (!select) return;

  const style = select.value;
  changeStyle(style);
}

/**
 * Detect system color scheme and set initial style
 */
export function detectSystemTheme() {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const styleSelect = document.getElementById('mapStyle');

  if (!styleSelect) return;

  // Set initial theme based on system preference
  if (darkModeQuery.matches) {
    styleSelect.value = MAP_STYLES.CYBER;
  }

  // Listen for system theme changes
  darkModeQuery.addEventListener('change', (e) => {
    const newStyle = e.matches ? MAP_STYLES.CYBER : MAP_STYLES.LIGHT;
    styleSelect.value = newStyle;

    const map = getMap();
    if (map) {
      changeStyle(newStyle, map);
    }
  });
}

/**
 * Get the current style from the dropdown
 * @returns {string}
 */
export function getCurrentStyle() {
  return document.getElementById('mapStyle')?.value || MAP_STYLES.CYBER;
}

/**
 * Initialize style control event listeners
 */
export function initStyleControlListeners() {
  document.getElementById('mapStyle')?.addEventListener('change', handleStyleChange);
}
