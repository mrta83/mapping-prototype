/**
 * Heatmap layer configuration and builders
 * @module layers/heatmap
 */

import { LAYER_IDS } from '../config/constants.js';

/**
 * @typedef {Object} HeatmapLayerConfig
 * @property {'count'|'weight'} metric - What heat intensity represents
 * @property {number} intensity - Heat intensity multiplier (0.1-2.0)
 * @property {number} radius - Heat radius in pixels (5-50)
 * @property {number} opacity - Layer opacity (0-1)
 */

/**
 * Default heatmap color ramp
 * Uses a spectrum from blue (low) to red (high)
 */
const DEFAULT_COLOR_RAMP = [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0, 'rgba(0,0,255,0)',
  0.1, 'royalblue',
  0.3, 'cyan',
  0.5, 'lime',
  0.7, 'yellow',
  1, 'red'
];

/**
 * Build weight expression based on metric
 * @param {'count'|'weight'} metric
 * @returns {Array|number} Mapbox expression or constant
 */
function buildWeightExpression(metric) {
  if (metric === 'weight') {
    // Weight by recycling volume: higher volume = more heat
    return [
      'interpolate', ['linear'],
      ['get', 'recyclingVolume'],
      1, 0.1,   // 1 ton = 10% weight
      10, 1     // 10 tons = 100% weight
    ];
  }

  // Each point weighted equally (density-based)
  return 1;
}

/**
 * Create heatmap layer configuration
 * @param {HeatmapLayerConfig} config
 * @returns {Object} Mapbox layer specification
 */
export function createHeatmapLayer(config) {
  const weightExpression = buildWeightExpression(config.metric);

  return {
    id: LAYER_IDS.HEATMAP,
    type: 'heatmap',
    source: 'points',
    paint: {
      'heatmap-weight': weightExpression,
      'heatmap-intensity': config.intensity,
      'heatmap-color': DEFAULT_COLOR_RAMP,
      'heatmap-radius': config.radius,
      'heatmap-opacity': config.opacity
    }
  };
}

/**
 * Create heatmap layer with custom color ramp
 * @param {HeatmapLayerConfig} config
 * @param {string} startColor - Start color (low density)
 * @param {string} endColor - End color (high density)
 * @returns {Object} Mapbox layer specification
 */
export function createCustomHeatmapLayer(config, startColor, endColor) {
  const weightExpression = buildWeightExpression(config.metric);

  // Custom color ramp using provided colors
  const colorRamp = [
    'interpolate', ['linear'], ['heatmap-density'],
    0, 'rgba(0,0,0,0)',
    0.2, startColor + '40',     // 25% opacity
    0.4, startColor + '80',     // 50% opacity
    0.6, endColor + '80',       // 50% opacity
    0.8, endColor + 'cc',       // 80% opacity
    1, endColor
  ];

  return {
    id: LAYER_IDS.HEATMAP,
    type: 'heatmap',
    source: 'points',
    paint: {
      'heatmap-weight': weightExpression,
      'heatmap-intensity': config.intensity,
      'heatmap-color': colorRamp,
      'heatmap-radius': config.radius,
      'heatmap-opacity': config.opacity
    }
  };
}

/**
 * Create all heatmap-related layers
 * @param {HeatmapLayerConfig} config
 * @returns {Object[]} Array of Mapbox layer specifications
 */
export function createHeatmapLayers(config) {
  return [createHeatmapLayer(config)];
}
