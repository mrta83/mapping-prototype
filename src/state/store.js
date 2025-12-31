/**
 * Centralized state management for the map application
 * @module state/store
 */

import { MODES, CLUSTER_DEFAULTS, HEATMAP_DEFAULTS, MARKER_DEFAULTS } from '../config/constants.js';

/**
 * @typedef {Object} ClusterSettings
 * @property {'count'|'weight'} sizeMetric - What cluster size represents
 * @property {'count'|'weight'} colorMetric - What cluster color represents
 * @property {number} radius - Cluster radius in pixels
 * @property {number} maxZoom - Max zoom level for clustering
 * @property {number} opacity - Cluster opacity (0-1)
 */

/**
 * @typedef {Object} HeatmapSettings
 * @property {'count'|'weight'} metric - What heat intensity represents
 * @property {number} intensity - Heat intensity multiplier
 * @property {number} radius - Heat radius in pixels
 * @property {number} opacity - Heatmap opacity (0-1)
 */

/**
 * @typedef {Object} MarkerSettings
 * @property {string} icon - Current marker icon name
 * @property {number} baseSize - Base marker size multiplier
 * @property {boolean} scaleByVolume - Whether to scale markers by volume
 */

/**
 * @typedef {Object} FilterSettings
 * @property {'all'|'small'|'medium'|'large'} volume - Volume filter
 * @property {'all'|string} category - Category filter
 */

/**
 * @typedef {Object} ColorSettings
 * @property {string} primary - Primary color hex
 * @property {string} secondary - Secondary color hex
 */

/**
 * @typedef {Object} LocationData
 * @property {number} id - Unique identifier
 * @property {number} lng - Longitude
 * @property {number} lat - Latitude
 * @property {number} value - Random value (0-100)
 * @property {string} category - Location category
 * @property {string} metro - Metro area name
 * @property {number} recyclingVolume - Recycling volume in tons/month (1-10)
 */

/**
 * Application state
 * @type {Object}
 */
const state = {
  /** @type {mapboxgl.Map|null} */
  map: null,

  /** @type {mapboxgl.Popup|null} */
  popup: null,

  /** @type {'clusters'|'heatmap'|'markers'} */
  mode: MODES.CLUSTERS,

  /** @type {boolean} Track if we auto-switched to clusters */
  autoSwitchedToCluster: false,

  /** @type {LocationData[]} Raw generated data */
  rawData: [],

  /** @type {GeoJSON.FeatureCollection|null} Current GeoJSON */
  geoJSON: null,

  /** @type {FilterSettings} */
  filters: {
    volume: 'all',
    category: 'all'
  },

  /** @type {ClusterSettings} */
  cluster: {
    sizeMetric: 'count',
    colorMetric: 'weight',
    radius: CLUSTER_DEFAULTS.RADIUS,
    maxZoom: CLUSTER_DEFAULTS.MAX_ZOOM,
    opacity: CLUSTER_DEFAULTS.OPACITY
  },

  /** @type {HeatmapSettings} */
  heatmap: {
    metric: 'count',
    intensity: HEATMAP_DEFAULTS.INTENSITY,
    radius: HEATMAP_DEFAULTS.RADIUS,
    opacity: HEATMAP_DEFAULTS.OPACITY
  },

  /** @type {MarkerSettings} */
  markers: {
    icon: 'recycling-bin',
    baseSize: MARKER_DEFAULTS.BASE_SIZE,
    scaleByVolume: true
  },

  /** @type {ColorSettings} */
  colors: {
    primary: '#3b82f6',
    secondary: '#ef4444'
  }
};

/**
 * State change subscribers
 * @type {Map<string, Set<Function>>}
 */
const subscribers = new Map();

/**
 * Subscribe to state changes
 * @param {string} key - State key to watch (supports dot notation: 'cluster.radius')
 * @param {Function} callback - Called with new value when state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribe(key, callback) {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key).add(callback);

  return () => subscribers.get(key).delete(callback);
}

/**
 * Whether batch mode is active (moved here for notify access)
 * @type {boolean}
 */
let batchMode = false;

/**
 * Pending notifications during batch mode
 * @type {Map<string, *>}
 */
const pendingNotifications = new Map();

/**
 * Notify subscribers of state change
 * @param {string} key - Changed state key
 * @param {*} value - New value
 */
function notify(key, value) {
  // In batch mode, queue notifications for later
  if (batchMode) {
    pendingNotifications.set(key, value);
    return;
  }

  fireNotification(key, value);
}

/**
 * Actually fire the notification to subscribers
 * @param {string} key
 * @param {*} value
 */
function fireNotification(key, value) {
  // Notify exact key subscribers
  if (subscribers.has(key)) {
    subscribers.get(key).forEach(cb => cb(value));
  }

  // Notify parent key subscribers (e.g., 'cluster' when 'cluster.radius' changes)
  const parts = key.split('.');
  if (parts.length > 1) {
    const parentKey = parts[0];
    if (subscribers.has(parentKey)) {
      subscribers.get(parentKey).forEach(cb => cb(getState(parentKey)));
    }
  }

  // Notify wildcard subscribers
  if (subscribers.has('*')) {
    subscribers.get('*').forEach(cb => cb({ key, value }));
  }
}

/**
 * Get state value by key (supports dot notation)
 * @param {string} key - State key
 * @returns {*} State value
 */
export function getState(key) {
  const parts = key.split('.');
  let value = state;

  for (const part of parts) {
    if (value === undefined || value === null) return undefined;
    value = value[part];
  }

  return value;
}

/**
 * Set state value by key (supports dot notation)
 * @param {string} key - State key
 * @param {*} value - New value
 */
export function setState(key, value) {
  const parts = key.split('.');
  let target = state;

  for (let i = 0; i < parts.length - 1; i++) {
    if (target[parts[i]] === undefined) {
      target[parts[i]] = {};
    }
    target = target[parts[i]];
  }

  const finalKey = parts[parts.length - 1];
  const oldValue = target[finalKey];

  if (oldValue !== value) {
    target[finalKey] = value;
    notify(key, value);
  }
}

/**
 * Get the map instance
 * @returns {mapboxgl.Map|null}
 */
export function getMap() {
  return state.map;
}

/**
 * Set the map instance
 * @param {mapboxgl.Map} map
 */
export function setMap(map) {
  state.map = map;
  notify('map', map);
}

/**
 * Get the popup instance
 * @returns {mapboxgl.Popup|null}
 */
export function getPopup() {
  return state.popup;
}

/**
 * Set the popup instance
 * @param {mapboxgl.Popup} popup
 */
export function setPopup(popup) {
  state.popup = popup;
}

/**
 * Get current visualization mode
 * @returns {'clusters'|'heatmap'|'markers'}
 */
export function getMode() {
  return state.mode;
}

/**
 * Set visualization mode
 * @param {'clusters'|'heatmap'|'markers'} mode
 */
export function setMode(mode) {
  if (state.mode !== mode) {
    state.mode = mode;
    notify('mode', mode);
  }
}

/**
 * Get raw location data
 * @returns {LocationData[]}
 */
export function getRawData() {
  return state.rawData;
}

/**
 * Set raw location data
 * @param {LocationData[]} data
 */
export function setRawData(data) {
  state.rawData = data;
  notify('rawData', data);
}

/**
 * Get current GeoJSON
 * @returns {GeoJSON.FeatureCollection|null}
 */
export function getGeoJSON() {
  return state.geoJSON;
}

/**
 * Set current GeoJSON
 * @param {GeoJSON.FeatureCollection} geoJSON
 */
export function setGeoJSON(geoJSON) {
  state.geoJSON = geoJSON;
  notify('geoJSON', geoJSON);
}

/**
 * Get filter settings
 * @returns {FilterSettings}
 */
export function getFilters() {
  return { ...state.filters };
}

/**
 * Set a filter value
 * @param {'volume'|'category'} filterType
 * @param {string} value
 */
export function setFilter(filterType, value) {
  if (state.filters[filterType] !== value) {
    state.filters[filterType] = value;
    notify(`filters.${filterType}`, value);
    notify('filters', state.filters);
  }
}

/**
 * Get cluster settings
 * @returns {ClusterSettings}
 */
export function getClusterSettings() {
  return { ...state.cluster };
}

/**
 * Update cluster setting
 * @param {keyof ClusterSettings} key
 * @param {*} value
 */
export function setClusterSetting(key, value) {
  if (state.cluster[key] !== value) {
    state.cluster[key] = value;
    notify(`cluster.${key}`, value);
  }
}

/**
 * Get heatmap settings
 * @returns {HeatmapSettings}
 */
export function getHeatmapSettings() {
  return { ...state.heatmap };
}

/**
 * Update heatmap setting
 * @param {keyof HeatmapSettings} key
 * @param {*} value
 */
export function setHeatmapSetting(key, value) {
  if (state.heatmap[key] !== value) {
    state.heatmap[key] = value;
    notify(`heatmap.${key}`, value);
  }
}

/**
 * Get marker settings
 * @returns {MarkerSettings}
 */
export function getMarkerSettings() {
  return { ...state.markers };
}

/**
 * Update marker setting
 * @param {keyof MarkerSettings} key
 * @param {*} value
 */
export function setMarkerSetting(key, value) {
  if (state.markers[key] !== value) {
    state.markers[key] = value;
    notify(`markers.${key}`, value);
  }
}

/**
 * Get color settings
 * @returns {ColorSettings}
 */
export function getColors() {
  return { ...state.colors };
}

/**
 * Update color setting
 * @param {'primary'|'secondary'} key
 * @param {string} value
 */
export function setColor(key, value) {
  if (state.colors[key] !== value) {
    state.colors[key] = value;
    notify(`colors.${key}`, value);
  }
}

/**
 * Get auto-switch tracking state
 * @returns {boolean}
 */
export function getAutoSwitchedToCluster() {
  return state.autoSwitchedToCluster;
}

/**
 * Set auto-switch tracking state
 * @param {boolean} value
 */
export function setAutoSwitchedToCluster(value) {
  state.autoSwitchedToCluster = value;
}

/**
 * Check if map is ready for layer operations
 * @returns {boolean}
 */
export function isMapReady() {
  return state.map !== null && state.map.isStyleLoaded() && state.geoJSON !== null;
}


// =============================================================================
// STATE VALIDATION
// =============================================================================

/**
 * Validation rules for state values
 * @type {Object<string, Function>}
 */
const validators = {
  'mode': (value) => Object.values(MODES).includes(value),
  'filters.volume': (value) => ['all', 'small', 'medium', 'large'].includes(value),
  'filters.category': (value) => typeof value === 'string',
  'cluster.radius': (value) => typeof value === 'number' && value >= 10 && value <= 200,
  'cluster.maxZoom': (value) => typeof value === 'number' && value >= 0 && value <= 22,
  'cluster.opacity': (value) => typeof value === 'number' && value >= 0 && value <= 1,
  'heatmap.intensity': (value) => typeof value === 'number' && value >= 0.1 && value <= 5,
  'heatmap.radius': (value) => typeof value === 'number' && value >= 5 && value <= 100,
  'heatmap.opacity': (value) => typeof value === 'number' && value >= 0 && value <= 1,
  'markers.baseSize': (value) => typeof value === 'number' && value >= 0.1 && value <= 3,
  'markers.scaleByVolume': (value) => typeof value === 'boolean',
  'colors.primary': (value) => typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value),
  'colors.secondary': (value) => typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)
};

/**
 * Validate a state value
 * @param {string} key - State key
 * @param {*} value - Value to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validateState(key, value) {
  const validator = validators[key];

  if (!validator) {
    // No validator defined, allow the value
    return { valid: true };
  }

  const isValid = validator(value);
  return isValid
    ? { valid: true }
    : { valid: false, error: `Invalid value for ${key}: ${JSON.stringify(value)}` };
}

/**
 * Set state with validation
 * @param {string} key - State key
 * @param {*} value - New value
 * @throws {Error} If validation fails
 */
export function setStateValidated(key, value) {
  const validation = validateState(key, value);

  if (!validation.valid) {
    console.warn(validation.error);
    return false;
  }

  setState(key, value);
  return true;
}


// =============================================================================
// BATCH UPDATES
// =============================================================================

/**
 * Perform multiple state updates in a batch
 * Notifications are deferred until the batch completes
 * @param {Function} updateFn - Function that performs updates
 */
export function batch(updateFn) {
  batchMode = true;
  pendingNotifications.clear();

  try {
    updateFn();
  } finally {
    batchMode = false;

    // Fire all pending notifications
    pendingNotifications.forEach((value, key) => {
      fireNotification(key, value);
    });
    pendingNotifications.clear();
  }
}

/**
 * Update multiple state values at once
 * @param {Object} updates - Key-value pairs to update
 */
export function setMultiple(updates) {
  batch(() => {
    Object.entries(updates).forEach(([key, value]) => {
      setState(key, value);
    });
  });
}


// =============================================================================
// STATE PERSISTENCE
// =============================================================================

/**
 * LocalStorage key for persisted state
 */
const STORAGE_KEY = 'map_app_state';

/**
 * Keys that should be persisted
 * @type {string[]}
 */
const persistedKeys = [
  'mode',
  'filters',
  'cluster',
  'heatmap',
  'markers',
  'colors'
];

/**
 * Save current state to localStorage
 */
export function persistState() {
  const toPersist = {};

  persistedKeys.forEach(key => {
    toPersist[key] = getState(key);
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    return true;
  } catch (e) {
    console.warn('Failed to persist state:', e);
    return false;
  }
}

/**
 * Restore state from localStorage
 * @returns {boolean} Whether restore was successful
 */
export function restoreState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const parsed = JSON.parse(stored);

    batch(() => {
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Merge object values
          Object.entries(value).forEach(([subKey, subValue]) => {
            const fullKey = `${key}.${subKey}`;
            const validation = validateState(fullKey, subValue);
            if (validation.valid) {
              setState(fullKey, subValue);
            }
          });
        } else {
          const validation = validateState(key, value);
          if (validation.valid) {
            setState(key, value);
          }
        }
      });
    });

    return true;
  } catch (e) {
    console.warn('Failed to restore state:', e);
    return false;
  }
}

/**
 * Clear persisted state
 */
export function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Auto-persist on state changes (call once at init)
 * @returns {Function} Unsubscribe function
 */
export function enableAutoPersist() {
  return subscribe('*', () => {
    // Debounce persistence
    clearTimeout(enableAutoPersist._timeout);
    enableAutoPersist._timeout = setTimeout(persistState, 1000);
  });
}


// =============================================================================
// DEBUGGING UTILITIES
// =============================================================================

/**
 * State change history
 * @type {Array<{timestamp: number, key: string, oldValue: *, newValue: *}>}
 */
const stateHistory = [];

/**
 * Maximum history entries to keep
 */
const MAX_HISTORY = 100;

/**
 * Whether to track state history
 * @type {boolean}
 */
let historyEnabled = false;

/**
 * Enable state history tracking
 */
export function enableHistory() {
  historyEnabled = true;

  // Subscribe to all changes
  subscribe('*', ({ key, value }) => {
    if (!historyEnabled) return;

    stateHistory.push({
      timestamp: Date.now(),
      key,
      newValue: value
    });

    // Trim history
    if (stateHistory.length > MAX_HISTORY) {
      stateHistory.shift();
    }
  });
}

/**
 * Disable state history tracking
 */
export function disableHistory() {
  historyEnabled = false;
}

/**
 * Get state change history
 * @param {number} [limit] - Maximum entries to return
 * @returns {Array}
 */
export function getHistory(limit) {
  const history = [...stateHistory];
  return limit ? history.slice(-limit) : history;
}

/**
 * Clear state history
 */
export function clearHistory() {
  stateHistory.length = 0;
}

/**
 * Get a snapshot of current state (for debugging)
 * @returns {Object}
 */
export function getSnapshot() {
  return {
    mode: state.mode,
    autoSwitchedToCluster: state.autoSwitchedToCluster,
    dataCount: state.rawData.length,
    hasGeoJSON: state.geoJSON !== null,
    filters: { ...state.filters },
    cluster: { ...state.cluster },
    heatmap: { ...state.heatmap },
    markers: { ...state.markers },
    colors: { ...state.colors },
    mapReady: isMapReady()
  };
}

/**
 * Log current state to console (for debugging)
 */
export function debugState() {
  console.group('Application State');
  console.log('Snapshot:', getSnapshot());
  console.log('Subscribers:', Array.from(subscribers.keys()));
  console.log('History entries:', stateHistory.length);
  console.groupEnd();
}

/**
 * Reset state to defaults
 */
export function resetState() {
  batch(() => {
    setState('mode', MODES.CLUSTERS);
    setState('autoSwitchedToCluster', false);
    setState('filters.volume', 'all');
    setState('filters.category', 'all');
    setState('cluster.sizeMetric', 'count');
    setState('cluster.colorMetric', 'weight');
    setState('cluster.radius', CLUSTER_DEFAULTS.RADIUS);
    setState('cluster.maxZoom', CLUSTER_DEFAULTS.MAX_ZOOM);
    setState('cluster.opacity', CLUSTER_DEFAULTS.OPACITY);
    setState('heatmap.metric', 'count');
    setState('heatmap.intensity', HEATMAP_DEFAULTS.INTENSITY);
    setState('heatmap.radius', HEATMAP_DEFAULTS.RADIUS);
    setState('heatmap.opacity', HEATMAP_DEFAULTS.OPACITY);
    setState('markers.icon', 'recycling-bin');
    setState('markers.baseSize', MARKER_DEFAULTS.BASE_SIZE);
    setState('markers.scaleByVolume', true);
    setState('colors.primary', '#3b82f6');
    setState('colors.secondary', '#ef4444');
  });
}
