/**
 * Memoized selectors for derived state
 * @module state/selectors
 */

import { getState, getRawData, getGeoJSON, getFilters, getMode, getClusterSettings, getHeatmapSettings, getMarkerSettings, getColors, subscribe } from './store.js';
import { LAYER_IDS, MODES } from '../config/constants.js';

/**
 * Simple memoization for selectors
 * @param {Function} fn - Selector function
 * @param {Function} dependencyFn - Returns array of dependencies to check
 * @returns {Function} Memoized selector
 */
function createSelector(fn, dependencyFn) {
  let cachedResult = null;
  let cachedDeps = null;

  return () => {
    const currentDeps = dependencyFn();

    // Check if dependencies changed
    if (cachedDeps !== null) {
      const depsEqual = cachedDeps.length === currentDeps.length &&
        cachedDeps.every((dep, i) => dep === currentDeps[i]);

      if (depsEqual) {
        return cachedResult;
      }
    }

    cachedDeps = currentDeps;
    cachedResult = fn();
    return cachedResult;
  };
}

/**
 * Get filtered data based on current filter settings
 * @returns {Object[]} Filtered raw data
 */
export const getFilteredData = createSelector(
  () => {
    const rawData = getRawData();
    const filters = getFilters();

    return rawData.filter(point => {
      // Volume filter
      if (filters.volume !== 'all') {
        const volume = point.recyclingVolume;
        const volumeMatch =
          (filters.volume === 'small' && volume <= 3) ||
          (filters.volume === 'medium' && volume > 3 && volume <= 6) ||
          (filters.volume === 'large' && volume > 6);

        if (!volumeMatch) return false;
      }

      // Category filter
      if (filters.category !== 'all') {
        if (point.category !== filters.category) return false;
      }

      return true;
    });
  },
  () => [getRawData(), getFilters().volume, getFilters().category]
);

/**
 * Get filtered data count
 * @returns {number}
 */
export const getFilteredCount = createSelector(
  () => getFilteredData().length,
  () => [getRawData(), getFilters().volume, getFilters().category]
);

/**
 * Get filtered GeoJSON
 * @returns {GeoJSON.FeatureCollection|null}
 */
export const getFilteredGeoJSON = createSelector(
  () => {
    const filteredData = getFilteredData();

    if (filteredData.length === 0) return null;

    return {
      type: 'FeatureCollection',
      features: filteredData.map(point => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat]
        },
        properties: {
          id: point.id,
          value: point.value,
          category: point.category,
          metro: point.metro,
          recyclingVolume: point.recyclingVolume,
          weight: point.recyclingVolume / 10
        }
      }))
    };
  },
  () => [getRawData(), getFilters().volume, getFilters().category]
);

/**
 * Get layer IDs that should be visible for current mode
 * @returns {string[]}
 */
export const getActiveLayerIds = createSelector(
  () => {
    const mode = getMode();

    switch (mode) {
      case MODES.CLUSTERS:
        return [
          LAYER_IDS.CLUSTERS,
          LAYER_IDS.CLUSTERS_GLOW,
          LAYER_IDS.CLUSTER_COUNT,
          LAYER_IDS.UNCLUSTERED,
          LAYER_IDS.UNCLUSTERED_GLOW
        ];
      case MODES.HEATMAP:
        return [LAYER_IDS.HEATMAP];
      case MODES.MARKERS:
        return [
          LAYER_IDS.MARKERS,
          LAYER_IDS.MARKERS_LABELS
        ];
      default:
        return [];
    }
  },
  () => [getMode()]
);

/**
 * Get all layer IDs (for cleanup operations)
 * @returns {string[]}
 */
export function getAllLayerIds() {
  return [
    LAYER_IDS.CLUSTERS,
    LAYER_IDS.CLUSTERS_GLOW,
    LAYER_IDS.CLUSTER_COUNT,
    LAYER_IDS.UNCLUSTERED_POINT,
    LAYER_IDS.UNCLUSTERED_GLOW,
    LAYER_IDS.HEATMAP,
    LAYER_IDS.MARKERS,
    LAYER_IDS.MARKERS_GLOW
  ];
}

/**
 * Get current layer configuration based on mode
 * @returns {Object}
 */
export const getCurrentLayerConfig = createSelector(
  () => {
    const mode = getMode();
    const colors = getColors();

    switch (mode) {
      case MODES.CLUSTERS:
        return {
          mode,
          ...getClusterSettings(),
          primary: colors.primary,
          secondary: colors.secondary
        };
      case MODES.HEATMAP:
        return {
          mode,
          ...getHeatmapSettings(),
          primary: colors.primary,
          secondary: colors.secondary
        };
      case MODES.MARKERS:
        return {
          mode,
          ...getMarkerSettings(),
          primary: colors.primary,
          secondary: colors.secondary
        };
      default:
        return { mode };
    }
  },
  () => [
    getMode(),
    getClusterSettings(),
    getHeatmapSettings(),
    getMarkerSettings(),
    getColors()
  ]
);

/**
 * Get statistics about current data
 * @returns {Object}
 */
export const getDataStats = createSelector(
  () => {
    const rawData = getRawData();
    const filteredData = getFilteredData();

    if (rawData.length === 0) {
      return {
        total: 0,
        filtered: 0,
        filterPercentage: 100,
        categories: {},
        volumeDistribution: { small: 0, medium: 0, large: 0 },
        avgVolume: 0
      };
    }

    // Category counts
    const categories = {};
    let totalVolume = 0;
    const volumeDistribution = { small: 0, medium: 0, large: 0 };

    filteredData.forEach(point => {
      categories[point.category] = (categories[point.category] || 0) + 1;
      totalVolume += point.recyclingVolume;

      if (point.recyclingVolume <= 3) volumeDistribution.small++;
      else if (point.recyclingVolume <= 6) volumeDistribution.medium++;
      else volumeDistribution.large++;
    });

    return {
      total: rawData.length,
      filtered: filteredData.length,
      filterPercentage: Math.round((filteredData.length / rawData.length) * 100),
      categories,
      volumeDistribution,
      avgVolume: filteredData.length > 0
        ? (totalVolume / filteredData.length).toFixed(1)
        : 0
    };
  },
  () => [getRawData(), getFilters().volume, getFilters().category]
);

/**
 * Check if any filters are active
 * @returns {boolean}
 */
export const hasActiveFilters = createSelector(
  () => {
    const filters = getFilters();
    return filters.volume !== 'all' || filters.category !== 'all';
  },
  () => [getFilters().volume, getFilters().category]
);

/**
 * Get bounds of current filtered data
 * @returns {[[number, number], [number, number]]|null} [[sw_lng, sw_lat], [ne_lng, ne_lat]]
 */
export const getFilteredBounds = createSelector(
  () => {
    const filteredData = getFilteredData();

    if (filteredData.length === 0) return null;

    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    filteredData.forEach(point => {
      minLng = Math.min(minLng, point.lng);
      maxLng = Math.max(maxLng, point.lng);
      minLat = Math.min(minLat, point.lat);
      maxLat = Math.max(maxLat, point.lat);
    });

    return [[minLng, minLat], [maxLng, maxLat]];
  },
  () => [getRawData(), getFilters().volume, getFilters().category]
);
