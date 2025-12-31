/**
 * Map interaction handlers (clicks, hovers, popups)
 * @module map/interactions
 */

import { LAYER_IDS, ZOOM, MODES } from '../config/constants.js';
import { getMap, getPopup, getMode, getAutoSwitchedToCluster, setAutoSwitchedToCluster } from '../state/store.js';
import { showAutoSwitchNotice, updateStats } from '../ui/notifications.js';
import { switchMode } from '../ui/controls.js';

/**
 * Setup cluster click handler for zoom expansion
 * @param {mapboxgl.Map} map
 */
function setupClusterClick(map) {
  map.on('click', LAYER_IDS.CLUSTERS, (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: [LAYER_IDS.CLUSTERS] });
    if (!features.length) return;

    const clusterId = features[0].properties.cluster_id;

    map.getSource('points').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) {
        console.error('Cluster expansion error:', err);
        return;
      }

      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom: zoom
      });
    });
  });

  // Cursor change on cluster hover
  map.on('mouseenter', LAYER_IDS.CLUSTERS, () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', LAYER_IDS.CLUSTERS, () => {
    map.getCanvas().style.cursor = '';
  });
}

/**
 * Setup point hover handler for popups
 * @param {mapboxgl.Map} map
 * @param {string} layerId - Layer to attach hover events to
 */
function setupPointHover(map, layerId) {
  const popup = getPopup();
  if (!popup) return;

  map.on('mouseenter', layerId, (e) => {
    map.getCanvas().style.cursor = 'pointer';

    const coords = e.features[0].geometry.coordinates.slice();
    const props = e.features[0].properties;

    popup.setLngLat(coords)
      .setHTML(`
        <div class="popup-title">${props.category}</div>
        <div class="popup-detail">${props.metro}</div>
        <div class="popup-detail">♻️ <strong>${props.recyclingVolume} tons</strong>/month</div>
      `)
      .addTo(map);
  });

  map.on('mouseleave', layerId, () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });
}

/**
 * Setup layer interactions based on current layers
 * @param {mapboxgl.Map} [map]
 */
export function setupLayerInteractions(map = getMap()) {
  if (!map) return;

  // Cluster interactions
  if (map.getLayer(LAYER_IDS.CLUSTERS)) {
    setupClusterClick(map);
  }

  // Point hover interactions
  const pointLayer = map.getLayer(LAYER_IDS.UNCLUSTERED) ? LAYER_IDS.UNCLUSTERED :
                     map.getLayer(LAYER_IDS.MARKERS) ? LAYER_IDS.MARKERS : null;

  if (pointLayer) {
    setupPointHover(map, pointLayer);
  }
}

/**
 * Check and handle automatic mode switching based on zoom level
 * @param {mapboxgl.Map} [map]
 */
export function checkAutoSwitchMode(map = getMap()) {
  if (!map) return;

  const zoom = map.getZoom();
  const mode = getMode();
  const autoSwitched = getAutoSwitchedToCluster();

  // Auto-switch from markers to clusters when zooming out
  if (mode === MODES.MARKERS && zoom < ZOOM.AUTO_SWITCH_THRESHOLD) {
    setAutoSwitchedToCluster(true);
    switchMode(MODES.CLUSTERS, true);
    showAutoSwitchNotice('Switched to Clusters (zoom < 8)');
  }
  // Auto-switch back to markers when zooming in (if we auto-switched before)
  else if (autoSwitched && mode === MODES.CLUSTERS && zoom >= ZOOM.AUTO_SWITCH_THRESHOLD) {
    setAutoSwitchedToCluster(false);
    switchMode(MODES.MARKERS, true);
    showAutoSwitchNotice('Switched to Markers (zoom ≥ 8)');
  }
}

/**
 * Update stats display based on current map state
 * @param {mapboxgl.Map} [map]
 */
export function updateMapStats(map = getMap()) {
  if (!map) return;

  const zoom = map.getZoom();

  // Count visible features
  const layers = [LAYER_IDS.UNCLUSTERED, LAYER_IDS.CLUSTERS].filter(l => map.getLayer(l));
  const features = map.queryRenderedFeatures({ layers });

  updateStats({
    visible: features.length,
    zoom: zoom
  });
}

/**
 * Setup map event listeners
 * @param {mapboxgl.Map} map
 */
export function setupMapEvents(map) {
  // Update stats on zoom/move
  map.on('zoom', () => {
    updateMapStats(map);
    checkAutoSwitchMode(map);
  });

  map.on('move', () => {
    updateMapStats(map);
  });

  // Initial stats update
  map.once('idle', () => {
    updateMapStats(map);
  });
}

/**
 * Clean up map event listeners
 * @param {mapboxgl.Map} map
 */
export function cleanupMapEvents(map) {
  map.off('zoom');
  map.off('move');
}
