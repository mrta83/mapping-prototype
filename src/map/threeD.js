/**
 * 3D building and terrain features
 * @module map/threeD
 */

import { LAYER_IDS, SOURCE_IDS, ZOOM, TIMING } from '../config/constants.js';
import { getMap } from '../state/store.js';

/**
 * Add 3D buildings layer to the map
 * @param {mapboxgl.Map} [map]
 */
export function add3DBuildings(map = getMap()) {
  if (!map || map.getLayer(LAYER_IDS.BUILDINGS_3D)) return;

  // Find the first symbol layer to insert buildings below labels
  const layers = map.getStyle().layers;
  let labelLayerId;

  for (const layer of layers) {
    if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
      labelLayerId = layer.id;
      break;
    }
  }

  map.addLayer({
    id: LAYER_IDS.BUILDINGS_3D,
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: ZOOM.BUILDINGS_MIN,
    paint: {
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['get', 'height'],
        0, '#e0e0e0',
        50, '#c0c0c0',
        100, '#a0a0a0',
        200, '#808080'
      ],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 0.8
    }
  }, labelLayerId);
}

/**
 * Remove 3D buildings layer from the map
 * @param {mapboxgl.Map} [map]
 */
export function remove3DBuildings(map = getMap()) {
  if (map && map.getLayer(LAYER_IDS.BUILDINGS_3D)) {
    map.removeLayer(LAYER_IDS.BUILDINGS_3D);
  }
}

/**
 * Toggle 3D buildings on/off
 * @param {boolean} [show] - Force show/hide, or toggle if undefined
 * @param {mapboxgl.Map} [map]
 */
export function toggle3DBuildings(show, map = getMap()) {
  const checkbox = document.getElementById('show3DBuildings');
  const shouldShow = show !== undefined ? show : checkbox?.checked;

  if (shouldShow) {
    add3DBuildings(map);

    // Set a nice pitch if currently flat
    if (map && map.getPitch() < 30) {
      map.easeTo({ pitch: 45, duration: TIMING.EASE_DURATION_MS });
    }
  } else {
    remove3DBuildings(map);
  }
}

/**
 * Add terrain source to the map
 * @param {mapboxgl.Map} [map]
 */
function addTerrainSource(map = getMap()) {
  if (!map || map.getSource(SOURCE_IDS.DEM)) return;

  map.addSource(SOURCE_IDS.DEM, {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    tileSize: 512,
    maxzoom: 14
  });
}

/**
 * Add sky layer for nice horizon effect
 * @param {mapboxgl.Map} [map]
 */
function addSkyLayer(map = getMap()) {
  if (!map || map.getLayer(LAYER_IDS.SKY)) return;

  map.addLayer({
    id: LAYER_IDS.SKY,
    type: 'sky',
    paint: {
      'sky-type': 'atmosphere',
      'sky-atmosphere-sun': [0.0, 90.0],
      'sky-atmosphere-sun-intensity': 15
    }
  });
}

/**
 * Remove sky layer
 * @param {mapboxgl.Map} [map]
 */
function removeSkyLayer(map = getMap()) {
  if (map && map.getLayer(LAYER_IDS.SKY)) {
    map.removeLayer(LAYER_IDS.SKY);
  }
}

/**
 * Add 3D terrain to the map
 * @param {number} [exaggeration=1.5] - Terrain exaggeration factor
 * @param {mapboxgl.Map} [map]
 */
export function add3DTerrain(exaggeration = 1.5, map = getMap()) {
  if (!map) return;

  addTerrainSource(map);

  map.setTerrain({
    source: SOURCE_IDS.DEM,
    exaggeration: exaggeration
  });

  addSkyLayer(map);
}

/**
 * Remove 3D terrain from the map
 * @param {mapboxgl.Map} [map]
 */
export function remove3DTerrain(map = getMap()) {
  if (!map) return;

  map.setTerrain(null);
  removeSkyLayer(map);
}

/**
 * Toggle 3D terrain on/off
 * @param {boolean} [show] - Force show/hide, or toggle if undefined
 * @param {mapboxgl.Map} [map]
 */
export function toggle3DTerrain(show, map = getMap()) {
  const checkbox = document.getElementById('show3DTerrain');
  const exaggerationSlider = document.getElementById('terrainExaggeration');
  const shouldShow = show !== undefined ? show : checkbox?.checked;

  if (shouldShow) {
    const exaggeration = parseFloat(document.getElementById('exaggeration')?.value || 1.5);
    add3DTerrain(exaggeration, map);

    // Show exaggeration slider
    if (exaggerationSlider) {
      exaggerationSlider.style.display = 'block';
    }

    // Set a nice pitch if currently flat
    if (map && map.getPitch() < 30) {
      map.easeTo({ pitch: 50, duration: TIMING.EASE_DURATION_MS });
    }
  } else {
    remove3DTerrain(map);

    // Hide exaggeration slider
    if (exaggerationSlider) {
      exaggerationSlider.style.display = 'none';
    }
  }
}

/**
 * Update terrain exaggeration
 * @param {number} value - Exaggeration value (0.5-3.0)
 * @param {mapboxgl.Map} [map]
 */
export function updateExaggeration(value, map = getMap()) {
  const valueDisplay = document.getElementById('exaggerationValue');
  if (valueDisplay) {
    valueDisplay.textContent = value;
  }

  if (map && map.getTerrain()) {
    map.setTerrain({
      source: SOURCE_IDS.DEM,
      exaggeration: parseFloat(value)
    });
  }
}

/**
 * Re-apply 3D features after a style change
 * @param {mapboxgl.Map} [map]
 */
export function reapply3DFeatures(map = getMap()) {
  if (!map) return;

  const buildingsChecked = document.getElementById('show3DBuildings')?.checked;
  const terrainChecked = document.getElementById('show3DTerrain')?.checked;

  if (buildingsChecked) {
    add3DBuildings(map);
  }

  if (terrainChecked) {
    const exaggeration = parseFloat(document.getElementById('exaggeration')?.value || 1.5);
    add3DTerrain(exaggeration, map);
  }
}

/**
 * Initialize 3D control event listeners
 */
export function init3DControlListeners() {
  document.getElementById('show3DBuildings')?.addEventListener('change', () => toggle3DBuildings());
  document.getElementById('show3DTerrain')?.addEventListener('change', () => toggle3DTerrain());
  document.getElementById('exaggeration')?.addEventListener('input', (e) => updateExaggeration(e.target.value));
}
