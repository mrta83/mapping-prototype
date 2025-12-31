/**
 * Cluster layer configuration and builders
 * @module layers/clusters
 */

import { LAYER_IDS } from '../config/constants.js';
import { mixColors } from '../utils/colors.js';

/**
 * @typedef {Object} ClusterLayerConfig
 * @property {string} primary - Primary color hex
 * @property {string} secondary - Secondary color hex
 * @property {'count'|'weight'} sizeMetric - What cluster size represents
 * @property {'count'|'weight'} colorMetric - What cluster color represents
 * @property {number} opacity - Layer opacity (0-1)
 */

/**
 * Build the size expression for clusters
 * @param {'count'|'weight'} sizeMetric
 * @returns {Array} Mapbox expression
 */
function buildSizeExpression(sizeMetric) {
  // Size steps: [baseSize, threshold1, size1, threshold2, size2, ...]
  const sizeSteps = sizeMetric === 'weight'
    ? [18, 20, 24, 50, 32, 100, 40]   // weight thresholds: 20t, 50t, 100t
    : [18, 10, 24, 50, 32, 100, 40];  // count thresholds: 10, 50, 100

  // Use coalesce for totalWeight to handle initial load
  const sizeValue = sizeMetric === 'weight'
    ? ['coalesce', ['get', 'totalWeight'], ['*', ['get', 'point_count'], 5]]
    : ['get', 'point_count'];

  return { sizeValue, sizeSteps };
}

/**
 * Build the color expression for clusters
 * @param {'count'|'weight'} colorMetric
 * @param {string} primary - Primary color
 * @param {string} secondary - Secondary color
 * @returns {Array} Mapbox expression
 */
function buildColorExpression(colorMetric, primary, secondary) {
  if (colorMetric === 'weight') {
    // Color by average weight per location
    return [
      'interpolate', ['linear'],
      ['/',
        ['coalesce', ['get', 'totalWeight'], ['*', ['get', 'point_count'], 5]],
        ['get', 'point_count']
      ],
      1, primary,      // 1 ton avg = primary
      5, mixColors(primary, secondary, 0.5),  // 5 tons avg = mid
      10, secondary    // 10 tons avg = secondary
    ];
  }

  // Color by count
  return [
    'step', ['get', 'point_count'],
    primary, 10,
    mixColors(primary, secondary, 0.3), 50,
    mixColors(primary, secondary, 0.6), 100,
    secondary
  ];
}

/**
 * Create cluster glow layer configuration
 * @param {ClusterLayerConfig} config
 * @returns {Object} Mapbox layer specification
 */
export function createClusterGlowLayer(config) {
  const { sizeValue, sizeSteps } = buildSizeExpression(config.sizeMetric);
  const colorExpression = buildColorExpression(config.colorMetric, config.primary, config.secondary);

  return {
    id: LAYER_IDS.CLUSTERS_GLOW,
    type: 'circle',
    source: 'points',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': colorExpression,
      'circle-radius': [
        'step', sizeValue,
        ...sizeSteps.map((v, i) => i % 2 === 0 ? v + 18 : v) // Larger radius for glow
      ],
      'circle-opacity': config.opacity * 0.5,
      'circle-blur': 0.8
    }
  };
}

/**
 * Create main cluster layer configuration
 * @param {ClusterLayerConfig} config
 * @returns {Object} Mapbox layer specification
 */
export function createClusterLayer(config) {
  const { sizeValue, sizeSteps } = buildSizeExpression(config.sizeMetric);
  const colorExpression = buildColorExpression(config.colorMetric, config.primary, config.secondary);

  return {
    id: LAYER_IDS.CLUSTERS,
    type: 'circle',
    source: 'points',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': colorExpression,
      'circle-radius': [
        'step', sizeValue,
        ...sizeSteps
      ],
      'circle-opacity': config.opacity,
      'circle-stroke-width': 2,
      'circle-stroke-color': 'rgba(255,255,255,0.6)'
    }
  };
}

/**
 * Create cluster count label layer configuration
 * @returns {Object} Mapbox layer specification
 */
export function createClusterCountLayer() {
  return {
    id: LAYER_IDS.CLUSTER_COUNT,
    type: 'symbol',
    source: 'points',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': [
        'concat',
        ['get', 'point_count'], ' · ',
        ['number-format',
          ['coalesce', ['get', 'totalWeight'], ['*', ['get', 'point_count'], 5]],
          { 'max-fraction-digits': 0 }
        ], 't'
      ],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 11
    },
    paint: {
      'text-color': '#fff'
    }
  };
}

/**
 * Create unclustered point glow layer configuration
 * @param {string} primary - Primary color
 * @param {number} opacity - Layer opacity
 * @returns {Object} Mapbox layer specification
 */
export function createUnclusteredGlowLayer(primary, opacity) {
  return {
    id: LAYER_IDS.UNCLUSTERED_GLOW,
    type: 'circle',
    source: 'points',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': primary,
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'recyclingVolume'],
        1, 12,
        10, 22
      ],
      'circle-opacity': opacity * 0.4,
      'circle-blur': 0.8
    }
  };
}

/**
 * Create unclustered point layer configuration
 * @param {string} primary - Primary color
 * @param {number} opacity - Layer opacity
 * @returns {Object} Mapbox layer specification
 */
export function createUnclusteredPointLayer(primary, opacity) {
  return {
    id: LAYER_IDS.UNCLUSTERED,
    type: 'circle',
    source: 'points',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': primary,
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'recyclingVolume'],
        1, 4,
        10, 10
      ],
      'circle-opacity': opacity,
      'circle-stroke-width': 2,
      'circle-stroke-color': 'rgba(255,255,255,0.6)'
    }
  };
}

/**
 * Create all cluster-related layers
 * @param {ClusterLayerConfig} config
 * @returns {Object[]} Array of Mapbox layer specifications
 */
export function createClusterLayers(config) {
  return [
    createClusterGlowLayer(config),
    createClusterLayer(config),
    createClusterCountLayer(),
    createUnclusteredGlowLayer(config.primary, config.opacity),
    createUnclusteredPointLayer(config.primary, config.opacity)
  ];
}
