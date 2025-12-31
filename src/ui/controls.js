/**
 * UI control handlers for sidebar and data panel
 * @module ui/controls
 */

import { TIMING, MODES } from '../config/constants.js';
import {
  getMap, getMode, setMode,
  setFilter, setClusterSetting, setHeatmapSetting, setMarkerSetting, setColor,
  setAutoSwitchedToCluster
} from '../state/store.js';
import { rebuildForMode, updateClusterOpacity, updateHeatmapProperties } from '../layers/index.js';
import { updateLegend } from './legend.js';

/**
 * Toggle sidebar visibility
 */
export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');

  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');

  if (toggle) {
    toggle.classList.toggle('collapsed', isCollapsed);
  }

  // Resize map after transition completes
  setTimeout(() => {
    const map = getMap();
    if (map) map.resize();
  }, TIMING.CSS_TRANSITION_MS);
}

/**
 * Toggle data panel visibility
 */
export function toggleDataPanel() {
  const panel = document.getElementById('dataPanel');
  const toggle = document.getElementById('dataPanelToggle');
  const modeSelector = document.querySelector('.map-mode-selector');

  panel.classList.toggle('open');
  const isOpen = panel.classList.contains('open');

  if (toggle) {
    toggle.classList.toggle('open', isOpen);
  }

  if (modeSelector) {
    modeSelector.classList.toggle('panel-open', isOpen);
  }

  // Resize map after transition completes
  setTimeout(() => {
    const map = getMap();
    if (map) map.resize();
  }, TIMING.CSS_TRANSITION_MS);
}

/**
 * Switch visualization mode
 * @param {string} mode - New mode ('clusters', 'heatmap', 'markers')
 * @param {boolean} [isAutoSwitch=false] - Whether this is an automatic switch
 */
export function switchMode(mode, isAutoSwitch = false) {
  setMode(mode);

  // Reset auto-switch tracking if user manually changed mode
  if (!isAutoSwitch) {
    setAutoSwitchedToCluster(false);
  }

  // Update UI buttons
  document.querySelectorAll('.map-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // Show/hide settings panels
  document.getElementById('clusterSettings').classList.toggle('hidden', mode !== MODES.CLUSTERS);
  document.getElementById('heatmapSettings').classList.toggle('hidden', mode !== MODES.HEATMAP);
  document.getElementById('markersSettings').classList.toggle('hidden', mode !== MODES.MARKERS);

  // Rebuild layers
  const map = getMap();
  if (map) {
    rebuildForMode(map);
  }
}

/**
 * Set category filter
 * @param {string} category - Category name or 'all'
 */
export function setCategoryFilter(category) {
  setFilter('category', category);

  // Update UI
  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });

  rebuildForMode();
}

/**
 * Set volume filter
 * @param {string} volume - Volume range ('all', 'small', 'medium', 'large')
 */
export function setVolumeFilter(volume) {
  setFilter('volume', volume);

  // Update UI
  document.querySelectorAll('[data-volume]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.volume === volume);
  });

  rebuildForMode();
}

/**
 * Set cluster size metric
 * @param {'count'|'weight'} metric
 */
export function setClusterSizeMetric(metric) {
  setClusterSetting('sizeMetric', metric);

  document.querySelectorAll('[data-size-metric]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sizeMetric === metric);
  });

  if (getMode() === MODES.CLUSTERS) {
    rebuildForMode();
  }
}

/**
 * Set cluster color metric
 * @param {'count'|'weight'} metric
 */
export function setClusterColorMetric(metric) {
  setClusterSetting('colorMetric', metric);

  document.querySelectorAll('[data-color-metric]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.colorMetric === metric);
  });

  if (getMode() === MODES.CLUSTERS) {
    rebuildForMode();
  }
}

/**
 * Update cluster radius (requires source rebuild)
 * @param {number} value
 */
export function updateClusterRadius(value) {
  document.getElementById('clusterRadiusValue').textContent = value;
  setClusterSetting('radius', parseInt(value));
  rebuildForMode();
}

/**
 * Update cluster max zoom (requires source rebuild)
 * @param {number} value
 */
export function updateClusterMaxZoom(value) {
  document.getElementById('clusterMaxZoomValue').textContent = value;
  setClusterSetting('maxZoom', parseInt(value));
  rebuildForMode();
}

/**
 * Update cluster opacity (uses paint properties, no rebuild)
 * @param {number} value
 */
export function handleClusterOpacityChange(value) {
  document.getElementById('clusterOpacityValue').textContent = value;
  const opacity = parseFloat(value);
  setClusterSetting('opacity', opacity);
  updateClusterOpacity(opacity);
}

/**
 * Set heatmap metric
 * @param {'count'|'weight'} metric
 */
export function setHeatMetric(metric) {
  setHeatmapSetting('metric', metric);

  document.querySelectorAll('[data-heat-metric]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.heatMetric === metric);
  });

  if (getMode() === MODES.HEATMAP) {
    rebuildForMode();
  }
}

/**
 * Update heatmap settings (uses paint properties, no rebuild)
 */
export function updateHeatmap() {
  const intensity = parseFloat(document.getElementById('heatIntensity').value);
  const radius = parseInt(document.getElementById('heatRadius').value);
  const opacity = parseFloat(document.getElementById('heatOpacity').value);

  document.getElementById('heatIntensityValue').textContent = intensity;
  document.getElementById('heatRadiusValue').textContent = radius;
  document.getElementById('heatOpacityValue').textContent = opacity;

  setHeatmapSetting('intensity', intensity);
  setHeatmapSetting('radius', radius);
  setHeatmapSetting('opacity', opacity);

  updateHeatmapProperties({ intensity, radius, opacity });
}

/**
 * Set marker icon
 * @param {string} icon - Icon name
 */
export function setMarkerIcon(icon) {
  setMarkerSetting('icon', icon);

  document.querySelectorAll('.icon-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.icon === icon);
  });

  if (getMode() === MODES.MARKERS) {
    rebuildForMode();
  }

  updateLegend();
}

/**
 * Update marker size
 * @param {number} value
 */
export function updateMarkerSize(value) {
  document.getElementById('markerSizeValue').textContent = value;
  setMarkerSetting('baseSize', parseFloat(value));

  if (getMode() === MODES.MARKERS) {
    rebuildForMode();
  }
}

/**
 * Update marker scaling by volume setting
 */
export function updateMarkerScaling() {
  const scaleByVolume = document.getElementById('scaleByVolume').checked;
  setMarkerSetting('scaleByVolume', scaleByVolume);

  if (getMode() === MODES.MARKERS) {
    rebuildForMode();
  }

  updateLegend();
}

/**
 * Update point count display
 * @param {number} value
 */
export function updatePointCount(value) {
  document.getElementById('pointCountValue').textContent = value;
}

/**
 * Update primary/secondary colors
 */
export function updateColors() {
  const primary = document.getElementById('primaryColor').value;
  const secondary = document.getElementById('secondaryColor').value;

  document.getElementById('primaryColorHex').textContent = primary;
  document.getElementById('secondaryColorHex').textContent = secondary;

  setColor('primary', primary);
  setColor('secondary', secondary);

  // Rebuild to apply new colors
  rebuildForMode();
  updateLegend();
}

/**
 * Initialize all control event listeners
 * This replaces the inline onclick handlers
 */
export function initControlListeners() {
  // Sidebar toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);

  // Data panel toggle
  document.getElementById('dataPanelToggle')?.addEventListener('click', toggleDataPanel);

  // Mode selector buttons
  document.querySelectorAll('.map-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  });

  // Category filter buttons
  document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => setCategoryFilter(btn.dataset.category));
  });

  // Volume filter buttons
  document.querySelectorAll('[data-volume]').forEach(btn => {
    btn.addEventListener('click', () => setVolumeFilter(btn.dataset.volume));
  });

  // Cluster metric buttons
  document.querySelectorAll('[data-size-metric]').forEach(btn => {
    btn.addEventListener('click', () => setClusterSizeMetric(btn.dataset.sizeMetric));
  });

  document.querySelectorAll('[data-color-metric]').forEach(btn => {
    btn.addEventListener('click', () => setClusterColorMetric(btn.dataset.colorMetric));
  });

  // Heatmap metric buttons
  document.querySelectorAll('[data-heat-metric]').forEach(btn => {
    btn.addEventListener('click', () => setHeatMetric(btn.dataset.heatMetric));
  });

  // Icon picker buttons
  document.querySelectorAll('.icon-btn[data-icon]').forEach(btn => {
    btn.addEventListener('click', () => setMarkerIcon(btn.dataset.icon));
  });

  // Slider inputs
  document.getElementById('clusterRadius')?.addEventListener('input', (e) => updateClusterRadius(e.target.value));
  document.getElementById('clusterMaxZoom')?.addEventListener('input', (e) => updateClusterMaxZoom(e.target.value));
  document.getElementById('clusterOpacity')?.addEventListener('input', (e) => handleClusterOpacityChange(e.target.value));
  document.getElementById('heatIntensity')?.addEventListener('input', updateHeatmap);
  document.getElementById('heatRadius')?.addEventListener('input', updateHeatmap);
  document.getElementById('heatOpacity')?.addEventListener('input', updateHeatmap);
  document.getElementById('markerSize')?.addEventListener('input', (e) => updateMarkerSize(e.target.value));
  document.getElementById('pointCount')?.addEventListener('input', (e) => updatePointCount(e.target.value));

  // Checkbox inputs
  document.getElementById('scaleByVolume')?.addEventListener('change', updateMarkerScaling);

  // Color inputs
  document.getElementById('primaryColor')?.addEventListener('change', updateColors);
  document.getElementById('secondaryColor')?.addEventListener('change', updateColors);
}
