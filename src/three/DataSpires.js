/**
 * 3D Data Spires Visualization
 * Renders data points as glowing 3D columns rising from the map
 * @module three/DataSpires
 */

import { createThreeLayer, lngLatToMercator, getMercatorScale } from './core.js';
import { getMap, getColors, getSpiresSettings } from '../state/store.js';
import { getFilteredGeoJSON } from '../state/selectors.js';
import { hexToRgb } from '../utils/colors.js';
import { LAYER_IDS, SPIRES_DEFAULTS as CONFIG_DEFAULTS } from '../config/constants.js';

/**
 * Layer ID for the spires visualization
 */
export const SPIRES_LAYER_ID = LAYER_IDS.SPIRES;

/**
 * Internal spires rendering defaults (extends config defaults)
 */
const RENDER_DEFAULTS = {
  SEGMENTS: 8,            // Number of cylinder segments (octagonal)
  GLOW_INTENSITY: 0.6,    // Glow layer opacity
  ANIMATION_SPEED: 0.001, // Pulse animation speed
  MAX_HEIGHT: 5000        // Maximum spire height in meters
};

/**
 * Current spires layer instance
 * @type {Object|null}
 */
let spiresLayer = null;

/**
 * Animation frame ID for cleanup
 * @type {number|null}
 */
let animationTime = 0;

/**
 * Create a single spire mesh
 * @param {Object} options - Spire options
 * @returns {THREE.Group} Group containing spire meshes
 */
function createSpire(options) {
  const {
    height,
    radius,
    color,
    glowColor,
    position,
    opacity = 0.85
  } = options;

  const group = new THREE.Group();

  // Main spire geometry - tapered cylinder (cone frustum)
  const geometry = new THREE.CylinderGeometry(
    radius * 0.3,  // Top radius (tapered)
    radius,        // Bottom radius
    height,
    RENDER_DEFAULTS.SEGMENTS,
    1,
    false
  );

  // Rotate geometry to stand upright (Y is up in Three.js)
  geometry.rotateX(Math.PI / 2);
  // Move pivot to bottom
  geometry.translate(0, 0, height / 2);

  // Main material with gradient effect
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide
  });

  const spire = new THREE.Mesh(geometry, material);
  group.add(spire);

  // Glow layer (slightly larger, more transparent)
  const glowGeometry = new THREE.CylinderGeometry(
    radius * 0.4,
    radius * 1.3,
    height,
    RENDER_DEFAULTS.SEGMENTS,
    1,
    false
  );
  glowGeometry.rotateX(Math.PI / 2);
  glowGeometry.translate(0, 0, height / 2);

  const glowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(glowColor),
    transparent: true,
    opacity: RENDER_DEFAULTS.GLOW_INTENSITY * opacity,
    side: THREE.DoubleSide
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);

  // Top cap with bright glow
  const capGeometry = new THREE.SphereGeometry(radius * 0.5, 8, 8);
  capGeometry.translate(0, 0, height);

  const capMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(glowColor),
    transparent: true,
    opacity: 0.9
  });

  const cap = new THREE.Mesh(capGeometry, capMaterial);
  group.add(cap);

  // Base ring
  const ringGeometry = new THREE.RingGeometry(radius * 0.8, radius * 1.5, RENDER_DEFAULTS.SEGMENTS);
  ringGeometry.rotateX(-Math.PI / 2);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });

  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  group.add(ring);

  // Store original height for animation
  group.userData = {
    originalHeight: height,
    pulsePhase: Math.random() * Math.PI * 2,
    spire,
    glow,
    cap,
    ring
  };

  // Position the group
  group.position.set(position.x, position.y, position.z);

  return group;
}

/**
 * Calculate spire color based on value
 * @param {number} value - Data value (recycling volume 1-10)
 * @param {string} primaryColor - Primary color hex
 * @param {string} secondaryColor - Secondary color hex
 * @returns {{main: string, glow: string}} Colors
 */
function calculateSpireColors(value, primaryColor, secondaryColor) {
  // Normalize value to 0-1 range (assuming 1-10 scale)
  const t = (value - 1) / 9;

  // Parse colors
  const primary = hexToRgb(primaryColor);
  const secondary = hexToRgb(secondaryColor);

  // Interpolate between primary (low) and secondary (high)
  const r = Math.round(primary.r + (secondary.r - primary.r) * t);
  const g = Math.round(primary.g + (secondary.g - primary.g) * t);
  const b = Math.round(primary.b + (secondary.b - primary.b) * t);

  const mainColor = `rgb(${r}, ${g}, ${b})`;

  // Glow is brighter version
  const glowR = Math.min(255, r + 60);
  const glowG = Math.min(255, g + 60);
  const glowB = Math.min(255, b + 60);
  const glowColor = `rgb(${glowR}, ${glowG}, ${glowB})`;

  return { main: mainColor, glow: glowColor };
}

/**
 * Create the spires layer
 * @param {Object} settings - Spires settings
 * @returns {Object} Mapbox CustomLayerInterface
 */
export function createSpiresLayer(settings = {}) {
  const {
    heightScale = CONFIG_DEFAULTS.HEIGHT_SCALE,
    baseRadius = CONFIG_DEFAULTS.BASE_RADIUS,
    opacity = CONFIG_DEFAULTS.OPACITY,
    heightMetric = 'volume',    // 'volume' or 'uniform'
    animate = CONFIG_DEFAULTS.ANIMATE
  } = settings;

  return createThreeLayer({
    id: SPIRES_LAYER_ID,

    onAdd(map, gl) {
      // Get data and colors
      const geoJSON = getFilteredGeoJSON();
      const colors = getColors();

      if (!geoJSON || !geoJSON.features) {
        console.warn('No data available for spires');
        return;
      }

      // Get center point for scale reference
      const bounds = map.getBounds();
      const centerLat = bounds.getCenter().lat;
      const scale = getMercatorScale(centerLat);

      // Create spires for each data point
      geoJSON.features.forEach((feature, index) => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        const volume = props.recyclingVolume || 1;

        // Calculate height based on metric
        let height;
        if (heightMetric === 'uniform') {
          height = heightScale * scale;
        } else {
          // Scale height by volume (1-10 range)
          height = (volume / 10) * heightScale * scale * 10;
        }

        // Clamp height
        height = Math.min(height, RENDER_DEFAULTS.MAX_HEIGHT * scale);

        // Calculate radius (slightly vary by volume)
        const radius = baseRadius * scale * (0.7 + (volume / 10) * 0.6);

        // Get colors
        const spireColors = calculateSpireColors(volume, colors.primary, colors.secondary);

        // Get mercator position
        const mercator = lngLatToMercator(lng, lat);

        // Create spire
        const spire = createSpire({
          height,
          radius,
          color: spireColors.main,
          glowColor: spireColors.glow,
          position: mercator,
          opacity
        });

        // Store volume for potential updates
        spire.userData.volume = volume;
        spire.userData.index = index;

        this.scene.add(spire);
      });

      // Add ambient light (even though we use MeshBasicMaterial, good for future)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambientLight);

      // Store settings for animation
      this.settings = { animate, heightScale, baseRadius, opacity };
      this.centerLat = centerLat;
    },

    render(gl, matrix) {
      if (!this.settings?.animate) return;

      // Update animation time
      animationTime += RENDER_DEFAULTS.ANIMATION_SPEED;

      // Animate each spire
      this.scene.children.forEach(child => {
        if (child.userData && child.userData.pulsePhase !== undefined) {
          const { pulsePhase, spire, glow, cap } = child.userData;

          // Subtle pulse effect
          const pulse = 1 + Math.sin(animationTime * 2 + pulsePhase) * 0.05;

          if (spire) {
            spire.scale.z = pulse;
          }
          if (glow) {
            glow.scale.z = pulse * 1.02;
            glow.material.opacity = RENDER_DEFAULTS.GLOW_INTENSITY * this.settings.opacity * (0.8 + Math.sin(animationTime * 3 + pulsePhase) * 0.2);
          }
          if (cap) {
            cap.material.opacity = 0.7 + Math.sin(animationTime * 4 + pulsePhase) * 0.3;
          }
        }
      });
    },

    onRemove() {
      animationTime = 0;
    }
  });
}

/**
 * Add spires visualization to the map
 * @param {Object} [settings] - Spires settings
 */
export function addSpiresLayer(settings = {}) {
  const map = getMap();
  if (!map) {
    console.warn('Map not ready for spires layer');
    return;
  }

  // Remove existing layer
  removeSpiresLayer();

  // Create and add new layer
  spiresLayer = createSpiresLayer(settings);

  // Find a good layer to insert before (labels should be on top)
  const layers = map.getStyle().layers;
  let beforeId;
  for (const layer of layers) {
    if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
      beforeId = layer.id;
      break;
    }
  }

  map.addLayer(spiresLayer, beforeId);

  // Tilt the map for better 3D view
  if (map.getPitch() < 45) {
    map.easeTo({ pitch: 60, bearing: -20, duration: 1000 });
  }
}

/**
 * Remove spires visualization from the map
 */
export function removeSpiresLayer() {
  const map = getMap();
  if (map && map.getLayer(SPIRES_LAYER_ID)) {
    map.removeLayer(SPIRES_LAYER_ID);
  }
  spiresLayer = null;
}

/**
 * Update spires with new settings (requires rebuild)
 * @param {Object} settings - New settings
 */
export function updateSpiresLayer(settings) {
  addSpiresLayer(settings);
}

/**
 * Check if spires layer is active
 * @returns {boolean}
 */
export function isSpiresLayerActive() {
  const map = getMap();
  return map && map.getLayer(SPIRES_LAYER_ID);
}

/**
 * Get spires layer settings from state (re-exported from store)
 * @returns {Object} Settings
 */
export { getSpiresSettings } from '../state/store.js';
