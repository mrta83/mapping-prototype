/**
 * Marker layer configuration and builders
 * @module layers/markers
 */

import { LAYER_IDS, ZOOM, MARKER_DEFAULTS } from '../config/constants.js';

/**
 * @typedef {Object} MarkerLayerConfig
 * @property {string} icon - Icon name from loaded images
 * @property {number} baseSize - Base icon size multiplier
 * @property {boolean} scaleByVolume - Whether to scale markers by recycling volume
 */

/**
 * Build icon size expression
 * @param {number} baseSize - Base size multiplier
 * @param {boolean} scaleByVolume - Whether to scale by volume
 * @returns {Array|number} Mapbox expression or constant
 */
function buildIconSizeExpression(baseSize, scaleByVolume) {
  if (scaleByVolume) {
    return [
      'interpolate', ['linear'],
      ['get', 'recyclingVolume'],
      1, baseSize * MARKER_DEFAULTS.MIN_SIZE_MULTIPLIER,   // Small (1-3t)
      5, baseSize,                                          // Medium (4-6t)
      10, baseSize * MARKER_DEFAULTS.MAX_SIZE_MULTIPLIER   // Large (7-10t)
    ];
  }

  return baseSize;
}

/**
 * Create marker layer configuration
 * @param {MarkerLayerConfig} config
 * @returns {Object} Mapbox layer specification
 */
export function createMarkerLayer(config) {
  const iconSizeExpr = buildIconSizeExpression(config.baseSize, config.scaleByVolume);

  return {
    id: LAYER_IDS.MARKERS,
    type: 'symbol',
    source: 'points',
    layout: {
      'icon-image': config.icon,
      'icon-size': iconSizeExpr,
      'icon-allow-overlap': true,
      'icon-anchor': 'bottom'
    }
  };
}

/**
 * Create marker labels layer configuration
 * Shows volume labels below markers at higher zoom levels
 * @returns {Object} Mapbox layer specification
 */
export function createMarkerLabelsLayer() {
  return {
    id: LAYER_IDS.MARKERS_LABELS,
    type: 'symbol',
    source: 'points',
    minzoom: ZOOM.LABELS_MIN,
    layout: {
      'text-field': ['concat', ['get', 'recyclingVolume'], 't'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 10,
      'text-offset': [0, 0.8],
      'text-anchor': 'top'
    },
    paint: {
      'text-color': '#1B5E20',
      'text-halo-color': '#fff',
      'text-halo-width': 1.5
    }
  };
}

/**
 * Create all marker-related layers
 * @param {MarkerLayerConfig} config
 * @returns {Object[]} Array of Mapbox layer specifications
 */
export function createMarkerLayers(config) {
  return [
    createMarkerLayer(config),
    createMarkerLabelsLayer()
  ];
}
