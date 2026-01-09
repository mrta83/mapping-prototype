/**
 * Legend rendering for map visualization modes
 * @module ui/legend
 */

import { MODES } from '../config/constants.js';
import { VOLUME_RANGES } from '../config/regions.js';
import { ICON_EMOJIS } from '../utils/icons.js';
import {
  getMode, getFilters, getColors,
  getClusterSettings, getHeatmapSettings, getMarkerSettings, getSpiresSettings
} from '../state/store.js';

/**
 * Build filter indicator HTML if any filters are active
 * @param {Object} filters - Current filter settings
 * @returns {string} HTML string
 */
function buildFilterIndicator(filters) {
  const activeFilters = [];

  if (filters.category !== 'all') {
    activeFilters.push(filters.category);
  }
  if (filters.volume !== 'all') {
    activeFilters.push(VOLUME_RANGES[filters.volume].label);
  }

  if (activeFilters.length === 0) {
    return '';
  }

  return `
    <div class="legend-section" style="background: #f0f9ff; margin: -12px -16px 10px -16px; padding: 8px 16px; border-radius: 8px 8px 0 0;">
      <div class="legend-text" style="color: #0369a1; font-weight: 500;">🔍 ${activeFilters.join(' + ')}</div>
    </div>
  `;
}

/**
 * Build cluster mode legend HTML
 * @param {Object} config
 * @returns {string} HTML string
 */
function buildClusterLegend(config) {
  const { primary, secondary, sizeMetric, colorMetric } = config;

  return `
    <div class="legend-title">Clusters</div>
    <div class="legend-section">
      <div class="legend-label">Size: ${sizeMetric === 'weight' ? 'Total Weight' : 'Location Count'}</div>
      <div class="legend-row">
        <div class="legend-circle" style="width: 14px; height: 14px; background: ${primary};"></div>
        <span class="legend-text">${sizeMetric === 'weight' ? '< 20 tons' : '< 10 locations'}</span>
      </div>
      <div class="legend-row">
        <div class="legend-circle" style="width: 20px; height: 20px; background: ${primary};"></div>
        <span class="legend-text">${sizeMetric === 'weight' ? '20-50 tons' : '10-50 locations'}</span>
      </div>
      <div class="legend-row">
        <div class="legend-circle" style="width: 28px; height: 28px; background: ${primary};"></div>
        <span class="legend-text">${sizeMetric === 'weight' ? '> 100 tons' : '> 100 locations'}</span>
      </div>
    </div>
    <div class="legend-section">
      <div class="legend-label">Color: ${colorMetric === 'weight' ? 'Avg Weight/Location' : 'Location Count'}</div>
      <div class="legend-gradient" style="background: linear-gradient(to right, ${primary}, ${secondary});"></div>
      <div class="legend-gradient-labels">
        <span>${colorMetric === 'weight' ? '1 ton' : 'Few'}</span>
        <span>${colorMetric === 'weight' ? '10 tons' : 'Many'}</span>
      </div>
    </div>
    <div class="legend-section">
      <div class="legend-label">Label Format</div>
      <div class="legend-text" style="font-size: 10px; color: #888;">count · total weight</div>
      <div class="legend-text" style="font-family: monospace;">42 · 156t</div>
    </div>
  `;
}

/**
 * Build heatmap mode legend HTML
 * @param {Object} config
 * @returns {string} HTML string
 */
function buildHeatmapLegend(config) {
  const { metric } = config;

  return `
    <div class="legend-title">Heatmap</div>
    <div class="legend-section">
      <div class="legend-label">${metric === 'weight' ? 'Total Weight Density' : 'Location Density'}</div>
      <div class="legend-gradient" style="background: linear-gradient(to right, rgba(0,0,255,0.3), cyan, lime, yellow, red);"></div>
      <div class="legend-gradient-labels">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
    <div class="legend-section">
      <div class="legend-text" style="font-size: 10px; color: #666;">
        ${metric === 'weight'
          ? 'Intensity weighted by recycling volume (tons/month)'
          : 'Each location weighted equally'}
      </div>
    </div>
  `;
}

/**
 * Build markers mode legend HTML
 * @param {Object} config
 * @returns {string} HTML string
 */
function buildMarkerLegend(config) {
  const { icon, scaleByVolume } = config;
  const emoji = ICON_EMOJIS[icon] || '📍';

  const sizeSection = scaleByVolume ? `
    <div class="legend-row">
      <span class="legend-icon" style="font-size: 12px;">${emoji}</span>
      <span class="legend-text">1-3 tons (small)</span>
    </div>
    <div class="legend-row">
      <span class="legend-icon" style="font-size: 16px;">${emoji}</span>
      <span class="legend-text">4-6 tons (medium)</span>
    </div>
    <div class="legend-row">
      <span class="legend-icon" style="font-size: 20px;">${emoji}</span>
      <span class="legend-text">7-10 tons (large)</span>
    </div>
  ` : `
    <div class="legend-row">
      <span class="legend-icon" style="font-size: 16px;">${emoji}</span>
      <span class="legend-text">All locations (uniform size)</span>
    </div>
  `;

  return `
    <div class="legend-title">Locations</div>
    <div class="legend-section">
      <div class="legend-label">Volume (tons/month)</div>
      ${sizeSection}
    </div>
    <div class="legend-section">
      <div class="legend-text" style="font-size: 10px; color: #666;">
        Labels show volume at zoom 12+
      </div>
    </div>
  `;
}

/**
 * Build spires mode legend HTML
 * @param {Object} config
 * @returns {string} HTML string
 */
function buildSpiresLegend(config) {
  const { primary, secondary, heightMetric } = config;

  return `
    <div class="legend-title">3D Spires</div>
    <div class="legend-section">
      <div class="legend-label">Height: ${heightMetric === 'volume' ? 'Recycling Volume' : 'Uniform'}</div>
      <div style="display: flex; align-items: flex-end; gap: 12px; margin: 8px 0;">
        <div style="width: 8px; height: 15px; background: linear-gradient(to top, ${primary}, ${secondary}); border-radius: 2px;"></div>
        <div style="width: 10px; height: 25px; background: linear-gradient(to top, ${primary}, ${secondary}); border-radius: 2px;"></div>
        <div style="width: 12px; height: 40px; background: linear-gradient(to top, ${primary}, ${secondary}); border-radius: 2px;"></div>
      </div>
      <div class="legend-gradient-labels">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
    <div class="legend-section">
      <div class="legend-label">Color Scale</div>
      <div class="legend-gradient" style="background: linear-gradient(to right, ${primary}, ${secondary});"></div>
      <div class="legend-gradient-labels">
        <span>1 ton/month</span>
        <span>10 tons/month</span>
      </div>
    </div>
    <div class="legend-section">
      <div class="legend-text" style="font-size: 10px; color: #666;">
        Tilt map for best 3D view
      </div>
    </div>
  `;
}

/**
 * Update the legend display based on current mode and settings
 */
export function updateLegend() {
  const legendEl = document.getElementById('legend');
  if (!legendEl) return;

  const mode = getMode();
  const filters = getFilters();
  const colors = getColors();

  const filterHtml = buildFilterIndicator(filters);
  let contentHtml = '';

  switch (mode) {
    case MODES.CLUSTERS: {
      const settings = getClusterSettings();
      contentHtml = buildClusterLegend({
        primary: colors.primary,
        secondary: colors.secondary,
        sizeMetric: settings.sizeMetric,
        colorMetric: settings.colorMetric
      });
      break;
    }

    case MODES.HEATMAP: {
      const settings = getHeatmapSettings();
      contentHtml = buildHeatmapLegend({
        metric: settings.metric
      });
      break;
    }

    case MODES.MARKERS: {
      const settings = getMarkerSettings();
      contentHtml = buildMarkerLegend({
        icon: settings.icon,
        scaleByVolume: settings.scaleByVolume
      });
      break;
    }

    case MODES.SPIRES: {
      const settings = getSpiresSettings();
      contentHtml = buildSpiresLegend({
        primary: colors.primary,
        secondary: colors.secondary,
        heightMetric: settings.heightMetric
      });
      break;
    }
  }

  legendEl.innerHTML = filterHtml + contentHtml;
}
