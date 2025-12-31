/**
 * Application-wide constants
 * @module config/constants
 */

/**
 * Timing constants in milliseconds
 */
export const TIMING = {
  /** Buffer after style load before rebuilding layers */
  STYLE_LOAD_BUFFER_MS: 150,
  /** Matches CSS transition duration for sidebar/panel animations */
  CSS_TRANSITION_MS: 350,
  /** Duration to show auto-switch notification */
  NOTICE_DISPLAY_MS: 2000,
  /** Map animation duration for flyTo/easeTo */
  FLY_DURATION_MS: 1500,
  /** Quick map animation duration */
  EASE_DURATION_MS: 500
};

/**
 * Zoom level thresholds
 */
export const ZOOM = {
  /** Zoom level below which markers auto-switch to clusters */
  AUTO_SWITCH_THRESHOLD: 8.0,
  /** Minimum zoom for 3D buildings */
  BUILDINGS_MIN: 12,
  /** Zoom level where marker labels appear */
  LABELS_MIN: 12
};

/**
 * Cluster configuration defaults
 */
export const CLUSTER_DEFAULTS = {
  RADIUS: 50,
  MAX_ZOOM: 14,
  OPACITY: 0.8
};

/**
 * Heatmap configuration defaults
 */
export const HEATMAP_DEFAULTS = {
  INTENSITY: 1,
  RADIUS: 20,
  OPACITY: 0.8
};

/**
 * Marker configuration defaults
 */
export const MARKER_DEFAULTS = {
  BASE_SIZE: 0.8,
  MIN_SIZE_MULTIPLIER: 0.7,
  MAX_SIZE_MULTIPLIER: 1.4
};

/**
 * Data generation defaults
 */
export const DATA_DEFAULTS = {
  POINT_COUNT: 500,
  MIN_VOLUME: 1,
  MAX_VOLUME: 10
};

/**
 * Layer IDs used throughout the application
 */
export const LAYER_IDS = {
  CLUSTERS: 'clusters',
  CLUSTERS_GLOW: 'clusters-glow',
  CLUSTER_COUNT: 'cluster-count',
  UNCLUSTERED: 'unclustered-point',
  UNCLUSTERED_GLOW: 'unclustered-point-glow',
  HEATMAP: 'heatmap',
  MARKERS: 'markers',
  MARKERS_LABELS: 'markers-labels',
  BUILDINGS_3D: '3d-buildings',
  SKY: 'sky'
};

/**
 * Source IDs
 */
export const SOURCE_IDS = {
  POINTS: 'points',
  DEM: 'mapbox-dem'
};

/**
 * Visualization modes
 * @type {Object.<string, string>}
 */
export const MODES = {
  CLUSTERS: 'clusters',
  HEATMAP: 'heatmap',
  MARKERS: 'markers'
};

/**
 * Available map styles
 */
export const MAP_STYLES = {
  CYBER: 'benkl13/cmjtcx5hy001e01sk2nq78n5x',
  DARK: 'dark-v11',
  LIGHT: 'light-v11',
  STREETS: 'streets-v12',
  SATELLITE: 'satellite-streets-v12',
  OUTDOORS: 'outdoors-v12',
  STANDARD: 'standard'
};
