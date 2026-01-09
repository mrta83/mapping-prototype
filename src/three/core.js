/**
 * Three.js core integration with Mapbox GL JS
 * Uses CustomLayerInterface to render Three.js content in Mapbox's WebGL context
 * @module three/core
 */

import { getMap } from '../state/store.js';

/**
 * Convert Mapbox LngLat to Mercator coordinates for Three.js
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {{x: number, y: number, z: number}} Mercator coordinates
 */
export function lngLatToMercator(lng, lat) {
  const mercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);
  return {
    x: mercatorCoordinate.x,
    y: mercatorCoordinate.y,
    z: mercatorCoordinate.z
  };
}

/**
 * Get the scale factor for converting meters to Mercator units at a given latitude
 * @param {number} lat - Latitude
 * @returns {number} Scale factor
 */
export function getMercatorScale(lat) {
  return mapboxgl.MercatorCoordinate.fromLngLat([0, lat], 0).meterInMercatorCoordinateUnits();
}

/**
 * Create a Three.js custom layer for Mapbox
 * @param {Object} options - Layer options
 * @param {string} options.id - Unique layer ID
 * @param {Function} options.onAdd - Called when layer is added to map
 * @param {Function} options.render - Called each frame
 * @param {Function} [options.onRemove] - Called when layer is removed
 * @returns {Object} Mapbox CustomLayerInterface
 */
export function createThreeLayer(options) {
  const { id, onAdd, render, onRemove } = options;

  return {
    id,
    type: 'custom',
    renderingMode: '3d',

    onAdd(map, gl) {
      // Create Three.js renderer using Mapbox's WebGL context
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });

      // Important: Don't let Three.js clear the canvas or manage state
      this.renderer.autoClear = false;
      this.renderer.autoClearColor = false;
      this.renderer.autoClearDepth = false;
      this.renderer.autoClearStencil = false;

      // Create scene and camera
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera();

      // Store map reference
      this.map = map;

      // Call custom onAdd
      if (onAdd) {
        onAdd.call(this, map, gl);
      }
    },

    render(gl, matrix) {
      // Convert Mapbox's matrix to Three.js format
      const m = new THREE.Matrix4().fromArray(matrix);

      // Update camera with Mapbox's view matrix
      this.camera.projectionMatrix = m;

      // Reset WebGL state for Three.js
      this.renderer.resetState();

      // Call custom render
      if (render) {
        render.call(this, gl, matrix);
      }

      // Render the scene
      this.renderer.render(this.scene, this.camera);

      // Request another frame
      this.map.triggerRepaint();
    },

    onRemove() {
      // Call custom onRemove
      if (onRemove) {
        onRemove.call(this);
      }

      // Clean up Three.js resources
      if (this.scene) {
        this.scene.traverse((object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }

      if (this.renderer) {
        this.renderer.dispose();
      }
    }
  };
}

/**
 * Transform a point from world coordinates to Three.js scene coordinates
 * @param {THREE.Vector3} point - Point to transform
 * @param {Array} matrix - Mapbox projection matrix
 * @returns {THREE.Vector3} Transformed point
 */
export function transformPoint(point, matrix) {
  const m = new THREE.Matrix4().fromArray(matrix);
  return point.clone().applyMatrix4(m);
}

/**
 * Create model transformation matrix for a location
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @param {number} [altitude=0] - Altitude in meters
 * @returns {THREE.Matrix4} Transformation matrix
 */
export function createModelMatrix(lng, lat, altitude = 0) {
  const mercator = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], altitude);
  const scale = mercator.meterInMercatorCoordinateUnits();

  const matrix = new THREE.Matrix4();
  matrix.makeTranslation(mercator.x, mercator.y, mercator.z);
  matrix.scale(new THREE.Vector3(scale, -scale, scale));

  return matrix;
}

/**
 * Check if Three.js is available
 * @returns {boolean}
 */
export function isThreeAvailable() {
  return typeof THREE !== 'undefined';
}

/**
 * Add Three.js layer to map
 * @param {Object} layer - CustomLayerInterface layer
 * @param {string} [beforeId] - ID of layer to insert before
 */
export function addThreeLayer(layer, beforeId) {
  const map = getMap();
  if (!map) {
    console.warn('Map not available for Three.js layer');
    return;
  }

  if (map.getLayer(layer.id)) {
    map.removeLayer(layer.id);
  }

  map.addLayer(layer, beforeId);
}

/**
 * Remove Three.js layer from map
 * @param {string} layerId - Layer ID to remove
 */
export function removeThreeLayer(layerId) {
  const map = getMap();
  if (map && map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
}
