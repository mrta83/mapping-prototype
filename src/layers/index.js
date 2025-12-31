/**
 * Layer management - adding, removing, and rebuilding map layers
 * @module layers
 */

import { LAYER_IDS, SOURCE_IDS, MODES } from '../config/constants.js';
import { VOLUME_RANGES } from '../config/regions.js';
import {
  getMap, getMode, getGeoJSON, getFilters,
  getClusterSettings, getHeatmapSettings, getMarkerSettings, getColors
} from '../state/store.js';
import {
  getFilteredGeoJSON,
  getFilteredCount as selectFilteredCount,
  getAllLayerIds
} from '../state/selectors.js';
import { createClusterLayers } from './clusters.js';
import { createHeatmapLayers } from './heatmap.js';
import { createMarkerLayers } from './markers.js';

/**
 * All layer IDs that may be added by the application
 * @type {string[]}
 */
const ALL_LAYER_IDS = [
  LAYER_IDS.CLUSTERS,
  LAYER_IDS.CLUSTERS_GLOW,
  LAYER_IDS.CLUSTER_COUNT,
  LAYER_IDS.UNCLUSTERED,
  LAYER_IDS.UNCLUSTERED_GLOW,
  LAYER_IDS.HEATMAP,
  LAYER_IDS.MARKERS,
  LAYER_IDS.MARKERS_LABELS
];

/**
 * Remove all custom layers and the points source
 * @param {mapboxgl.Map} map
 */
export function removeAllLayers(map = getMap()) {
  if (!map) return;

  ALL_LAYER_IDS.forEach(id => {
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
  });

  if (map.getSource(SOURCE_IDS.POINTS)) {
    map.removeSource(SOURCE_IDS.POINTS);
  }
}

/**
 * Apply filters to GeoJSON data
 * @param {GeoJSON.FeatureCollection} geoJSON - Source GeoJSON
 * @param {Object} filters - Filter settings
 * @returns {GeoJSON.FeatureCollection} Filtered GeoJSON
 */
export function applyFilters(geoJSON, filters = getFilters()) {
  if (!geoJSON) return null;

  let features = geoJSON.features;

  // Apply category filter
  if (filters.category !== 'all') {
    features = features.filter(f => f.properties.category === filters.category);
  }

  // Apply volume filter
  if (filters.volume !== 'all') {
    const range = VOLUME_RANGES[filters.volume];
    features = features.filter(f =>
      f.properties.recyclingVolume >= range.min &&
      f.properties.recyclingVolume <= range.max
    );
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Get the count of filtered features
 * @param {GeoJSON.FeatureCollection} geoJSON
 * @param {Object} filters
 * @returns {number}
 */
export function getFilteredCount(geoJSON, filters = getFilters()) {
  const filtered = applyFilters(geoJSON, filters);
  return filtered ? filtered.features.length : 0;
}

/**
 * Create layer configurations based on current mode
 * @param {string} mode - Visualization mode
 * @returns {Object[]} Array of layer configurations
 */
function createLayersForMode(mode) {
  const colors = getColors();

  switch (mode) {
    case MODES.CLUSTERS: {
      const settings = getClusterSettings();
      return createClusterLayers({
        primary: colors.primary,
        secondary: colors.secondary,
        sizeMetric: settings.sizeMetric,
        colorMetric: settings.colorMetric,
        opacity: settings.opacity
      });
    }

    case MODES.HEATMAP: {
      const settings = getHeatmapSettings();
      return createHeatmapLayers({
        metric: settings.metric,
        intensity: settings.intensity,
        radius: settings.radius,
        opacity: settings.opacity
      });
    }

    case MODES.MARKERS: {
      const settings = getMarkerSettings();
      return createMarkerLayers({
        icon: settings.icon,
        baseSize: settings.baseSize,
        scaleByVolume: settings.scaleByVolume
      });
    }

    default:
      console.warn(`Unknown mode: ${mode}`);
      return [];
  }
}

/**
 * Add layers to the map based on current mode
 * @param {mapboxgl.Map} map
 */
export function addLayers(map = getMap()) {
  if (!map) return;

  const mode = getMode();
  const layers = createLayersForMode(mode);

  layers.forEach(layer => {
    map.addLayer(layer);
  });
}

/**
 * Add data source to the map
 * @param {mapboxgl.Map} map
 * @param {GeoJSON.FeatureCollection} data - Filtered GeoJSON data
 * @param {Object} options - Source options
 */
export function addSource(map, data, options = {}) {
  const mode = getMode();
  const clusterSettings = getClusterSettings();
  const shouldCluster = mode === MODES.CLUSTERS;

  const sourceConfig = {
    type: 'geojson',
    data,
    cluster: shouldCluster,
    clusterMaxZoom: clusterSettings.maxZoom,
    clusterRadius: clusterSettings.radius,
    ...options
  };

  // Add cluster aggregation properties when clustering
  if (shouldCluster) {
    sourceConfig.clusterProperties = {
      totalWeight: ['+', ['get', 'recyclingVolume']]
    };
  }

  map.addSource(SOURCE_IDS.POINTS, sourceConfig);
}

/**
 * Rebuild layers for current mode with current filters
 * Main function to call when mode, filters, or settings change
 * Uses memoized selectors for efficient filtering
 * @param {mapboxgl.Map} [map]
 * @returns {number} Number of features after filtering
 */
export function rebuildForMode(map = getMap()) {
  if (!map || !map.isStyleLoaded()) {
    console.warn('Map not ready for layer rebuild');
    return 0;
  }

  // Use memoized selector for filtered GeoJSON
  const filteredData = getFilteredGeoJSON();
  if (!filteredData) {
    console.warn('No data available after filtering');
    return 0;
  }

  // Remove existing layers and source
  removeAllLayers(map);

  // Add source with filtered data
  addSource(map, filteredData);

  // Add layers for current mode
  addLayers(map);

  return filteredData.features.length;
}

/**
 * Update a paint property on a layer if it exists
 * @param {string} layerId
 * @param {string} property
 * @param {*} value
 * @param {mapboxgl.Map} [map]
 */
export function updateLayerPaint(layerId, property, value, map = getMap()) {
  if (map && map.getLayer(layerId)) {
    map.setPaintProperty(layerId, property, value);
  }
}

/**
 * Update cluster opacity without full rebuild
 * @param {number} opacity
 * @param {mapboxgl.Map} [map]
 */
export function updateClusterOpacity(opacity, map = getMap()) {
  if (!map) return;

  updateLayerPaint(LAYER_IDS.CLUSTERS, 'circle-opacity', opacity, map);
  updateLayerPaint(LAYER_IDS.CLUSTERS_GLOW, 'circle-opacity', opacity * 0.5, map);
  updateLayerPaint(LAYER_IDS.UNCLUSTERED, 'circle-opacity', opacity, map);
  updateLayerPaint(LAYER_IDS.UNCLUSTERED_GLOW, 'circle-opacity', opacity * 0.4, map);
}

/**
 * Update heatmap properties without full rebuild
 * @param {Object} settings - Partial heatmap settings
 * @param {mapboxgl.Map} [map]
 */
export function updateHeatmapProperties(settings, map = getMap()) {
  if (!map || !map.getLayer(LAYER_IDS.HEATMAP)) return;

  if (settings.intensity !== undefined) {
    updateLayerPaint(LAYER_IDS.HEATMAP, 'heatmap-intensity', settings.intensity, map);
  }
  if (settings.radius !== undefined) {
    updateLayerPaint(LAYER_IDS.HEATMAP, 'heatmap-radius', settings.radius, map);
  }
  if (settings.opacity !== undefined) {
    updateLayerPaint(LAYER_IDS.HEATMAP, 'heatmap-opacity', settings.opacity, map);
  }
}

// Re-export layer IDs for convenience
export { LAYER_IDS, SOURCE_IDS };
