/**
 * Main application entry point
 * @module main
 */

import { REGIONS } from './config/regions.js';
import { TIMING } from './config/constants.js';
import {
  setMap, setPopup, setRawData, setGeoJSON, getRawData,
  restoreState, enableAutoPersist, enableHistory, debugState
} from './state/store.js';
import { getFilteredCount } from './state/selectors.js';
import { loadMarkerIcons } from './utils/icons.js';
import { generateDataWithGeoJSON, calculateBounds } from './data/generator.js';
import { rebuildForMode } from './layers/index.js';
import { updateLegend } from './ui/legend.js';
import { updateStats, updateFilteredCount } from './ui/notifications.js';
import { initControlListeners } from './ui/controls.js';
import { setupMapEvents, setupLayerInteractions } from './map/interactions.js';
import { init3DControlListeners } from './map/threeD.js';
import { detectSystemTheme, initStyleControlListeners, buildStyleUrl, getCurrentStyle } from './map/style.js';

/**
 * Storage key for Mapbox token
 */
const TOKEN_STORAGE_KEY = 'mapbox_token';

/**
 * Show the token input modal
 */
function showTokenModal() {
  document.getElementById('tokenModal').classList.remove('hidden');
}

/**
 * Hide the token input modal
 */
function hideTokenModal() {
  document.getElementById('tokenModal').classList.add('hidden');
}

/**
 * Save and validate the Mapbox token
 */
function saveToken() {
  const input = document.getElementById('tokenInput');
  const token = input.value.trim();

  if (!token) {
    return;
  }

  // Basic validation - Mapbox public tokens start with 'pk.'
  if (!token.startsWith('pk.')) {
    alert('Invalid token format. Mapbox public tokens start with "pk."');
    return;
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  hideTokenModal();
  initMap(token);
}

/**
 * Get stored Mapbox token
 * @returns {string|null}
 */
function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Get current region from dropdown
 * @returns {Object} Region configuration
 */
function getCurrentRegion() {
  const regionId = document.getElementById('region')?.value || 'texas';
  return REGIONS[regionId];
}

/**
 * Initialize the Mapbox map
 * @param {string} token - Mapbox access token
 */
async function initMap(token) {
  // Set Mapbox access token
  mapboxgl.accessToken = token;

  const region = getCurrentRegion();
  const initialStyle = getCurrentStyle();
  const styleUrl = buildStyleUrl(initialStyle);

  // Create map instance
  const map = new mapboxgl.Map({
    container: 'map',
    style: styleUrl,
    center: region.center,
    zoom: region.zoom
  });

  // Store map in state
  setMap(map);

  // Add navigation controls
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

  // Create reusable popup
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });
  setPopup(popup);

  // Handle map load
  map.on('load', async () => {
    try {
      // Load marker icons
      await loadMarkerIcons(map);

      // Generate initial data
      regenerateData();

      // Setup map event listeners
      setupMapEvents(map);

    } catch (error) {
      console.error('Error during map initialization:', error);
    }
  });

  // Handle map errors
  map.on('error', (e) => {
    console.error('Map error:', e);
  });
}

/**
 * Generate new data based on current settings
 */
export function regenerateData() {
  const count = parseInt(document.getElementById('pointCount')?.value || 500);
  const distribution = document.getElementById('distribution')?.value || 'clustered';
  const regionId = document.getElementById('region')?.value || 'texas';

  // Generate data
  const { raw, geoJSON } = generateDataWithGeoJSON(count, distribution, regionId);

  // Store in state
  setRawData(raw);
  setGeoJSON(geoJSON);

  // Rebuild layers
  rebuildForMode();

  // Get filtered count from memoized selector
  const filteredCount = getFilteredCount();

  // Setup interactions for new layers
  setupLayerInteractions();

  // Update displays
  updateStats({
    total: raw.length,
    filtered: filteredCount
  });
  updateFilteredCount(filteredCount);
  updateLegend();
}

/**
 * Change the active region
 */
export function changeRegion() {
  const map = mapboxgl.Map && window.map;
  const region = getCurrentRegion();

  if (map) {
    map.flyTo({
      center: region.center,
      zoom: region.zoom,
      duration: TIMING.FLY_DURATION_MS
    });
  }

  regenerateData();
}

/**
 * Fit map bounds to current data
 */
export function fitBounds() {
  const rawData = getRawData();
  if (rawData.length === 0) return;

  const bounds = calculateBounds(rawData);
  if (!bounds) return;

  const map = mapboxgl.Map && window.map;
  if (map) {
    map.fitBounds(bounds, { padding: 50 });
  }
}

/**
 * Reset view to current region defaults
 */
export function resetView() {
  const region = getCurrentRegion();
  const map = mapboxgl.Map && window.map;

  if (map) {
    map.flyTo({
      center: region.center,
      zoom: region.zoom,
      duration: 1000
    });
  }
}

/**
 * Initialize all event listeners
 */
function initEventListeners() {
  // Token modal
  document.querySelector('#tokenModal .btn.primary')?.addEventListener('click', saveToken);

  // Enter key in token input
  document.getElementById('tokenInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveToken();
  });

  // UI controls
  initControlListeners();

  // Style controls
  initStyleControlListeners();

  // 3D controls
  init3DControlListeners();

  // Data generation controls
  document.getElementById('distribution')?.addEventListener('change', regenerateData);
  document.getElementById('region')?.addEventListener('change', changeRegion);
  document.querySelector('[onclick*="regenerateData"]')?.addEventListener('click', regenerateData);

  // Action buttons
  document.querySelector('[onclick*="fitBounds"]')?.addEventListener('click', fitBounds);
  document.querySelector('[onclick*="resetView"]')?.addEventListener('click', resetView);
}

/**
 * Main application initialization
 */
function init() {
  // Restore persisted state (mode, filters, colors, etc.)
  const restored = restoreState();
  if (restored) {
    console.log('Restored saved state settings');
  }

  // Enable auto-persist for state changes
  enableAutoPersist();

  // Enable state history for debugging (can be disabled in production)
  if (window.location.search.includes('debug')) {
    enableHistory();
    window.debugState = debugState; // Expose for console access
    console.log('Debug mode enabled. Use debugState() in console.');
  }

  // Detect system theme preference
  detectSystemTheme();

  // Initialize event listeners
  initEventListeners();

  // Check for stored token
  const token = getStoredToken();

  if (token) {
    initMap(token);
  } else {
    showTokenModal();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export functions that need to be accessible from HTML (for backwards compatibility)
// These can be removed once inline onclick handlers are replaced
window.saveToken = saveToken;
window.regenerateData = regenerateData;
window.changeRegion = changeRegion;
window.fitBounds = fitBounds;
window.resetView = resetView;
