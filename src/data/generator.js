/**
 * Synthetic data generation for map visualization
 * @module data/generator
 */

import { REGIONS, TEXAS_METROS, CATEGORIES } from '../config/regions.js';
import { DATA_DEFAULTS } from '../config/constants.js';

/**
 * @typedef {Object} LocationData
 * @property {number} id - Unique identifier
 * @property {number} lng - Longitude
 * @property {number} lat - Latitude
 * @property {number} value - Random value (0-100)
 * @property {string} category - Location category
 * @property {string} metro - Metro area name
 * @property {number} recyclingVolume - Recycling volume in tons/month (1-10)
 */

/**
 * Distribution algorithm types
 * @typedef {'clustered'|'uniform'|'route'|'coastal'} DistributionType
 */

/**
 * Generate clustered distribution coordinates
 * @param {number[]} baseCenter - [lng, lat]
 * @param {number} baseSpread - Spread factor
 * @returns {{lng: number, lat: number}}
 */
function generateClusteredPoint(baseCenter, baseSpread) {
  // Create neighborhood clusters within the metro
  const clusterOffset = [
    (Math.random() - 0.5) * baseSpread,
    (Math.random() - 0.5) * baseSpread
  ];
  // Tighter clustering around cluster centers
  return {
    lng: baseCenter[0] + clusterOffset[0] + (Math.random() - 0.5) * baseSpread * 0.15,
    lat: baseCenter[1] + clusterOffset[1] + (Math.random() - 0.5) * baseSpread * 0.15
  };
}

/**
 * Generate uniform distribution coordinates
 * @param {number[]} baseCenter - [lng, lat]
 * @param {number} baseSpread - Spread factor
 * @returns {{lng: number, lat: number}}
 */
function generateUniformPoint(baseCenter, baseSpread) {
  return {
    lng: baseCenter[0] + (Math.random() - 0.5) * baseSpread * 2,
    lat: baseCenter[1] + (Math.random() - 0.5) * baseSpread * 2
  };
}

/**
 * Generate route/corridor distribution coordinates
 * @param {number[]} baseCenter - [lng, lat]
 * @param {number} baseSpread - Spread factor
 * @param {boolean} isTexasWide - Whether this is a Texas-wide distribution
 * @returns {{lng: number, lat: number}}
 */
function generateRoutePoint(baseCenter, baseSpread, isTexasWide) {
  if (isTexasWide) {
    // I-35 corridor (San Antonio -> Austin -> Dallas)
    const t = Math.random();
    const i35Noise = (Math.random() - 0.5) * 0.15;

    if (t < 0.4) {
      // SA to Austin segment
      return {
        lng: -98.4936 + (t / 0.4) * 0.75 + i35Noise,
        lat: 29.4241 + (t / 0.4) * 0.85 + i35Noise * 0.5
      };
    } else {
      // Austin to Dallas segment
      const t2 = (t - 0.4) / 0.6;
      return {
        lng: -97.7431 + t2 * 0.95 + i35Noise,
        lat: 30.2672 + t2 * 2.5 + i35Noise * 0.5
      };
    }
  }

  // Radial highways from city center
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * baseSpread;
  const noise = (Math.random() - 0.5) * 0.02;

  return {
    lng: baseCenter[0] + Math.cos(angle) * dist + noise,
    lat: baseCenter[1] + Math.sin(angle) * dist + noise
  };
}

/**
 * Generate coastal/loop distribution coordinates
 * @param {number[]} baseCenter - [lng, lat]
 * @param {string} region - Region identifier
 * @param {boolean} isTexasWide - Whether this is a Texas-wide distribution
 * @returns {{lng: number, lat: number}}
 */
function generateCoastalPoint(baseCenter, region, isTexasWide) {
  if (region === 'houston' || isTexasWide) {
    // Houston: concentrate toward Gulf Coast / Ship Channel
    const coastBias = Math.random() * 0.7;
    return {
      lng: baseCenter[0] + coastBias * 0.5 + (Math.random() - 0.5) * 0.2,
      lat: baseCenter[1] - coastBias * 0.3 + (Math.random() - 0.5) * 0.15
    };
  }

  // Other cities: ring pattern (loop highways)
  const angle = Math.random() * Math.PI * 2;
  const dist = 0.08 + Math.random() * 0.12;

  return {
    lng: baseCenter[0] + Math.cos(angle) * dist,
    lat: baseCenter[1] + Math.sin(angle) * dist
  };
}

/**
 * Pick a metro area based on population weights
 * @returns {Object|null} Metro object or null for single-city regions
 */
function pickWeightedMetro() {
  const rand = Math.random();
  let cumulative = 0;

  for (const metro of TEXAS_METROS) {
    cumulative += metro.weight;
    if (rand < cumulative) {
      return metro;
    }
  }

  return TEXAS_METROS[TEXAS_METROS.length - 1];
}

/**
 * Generate a single location data point
 * @param {number} id - Point ID
 * @param {DistributionType} distribution - Distribution algorithm
 * @param {string} region - Region identifier
 * @param {Object} regionConfig - Region configuration from REGIONS
 * @returns {LocationData}
 */
function generatePoint(id, distribution, region, regionConfig) {
  const isTexasWide = region === 'texas';
  const defaultSpread = isTexasWide ? 0.3 : (region === 'dallas' ? 0.35 : 0.25);

  // For Texas-wide, pick a metro based on population weights
  const metro = isTexasWide ? pickWeightedMetro() : null;

  const baseCenter = metro ? metro.center : regionConfig.center;
  const baseSpread = metro ? metro.spread : defaultSpread;

  // Generate coordinates based on distribution type
  let coords;
  switch (distribution) {
    case 'clustered':
      coords = generateClusteredPoint(baseCenter, baseSpread);
      break;
    case 'uniform':
      coords = generateUniformPoint(baseCenter, baseSpread);
      break;
    case 'route':
      coords = generateRoutePoint(baseCenter, baseSpread, isTexasWide);
      break;
    case 'coastal':
      coords = generateCoastalPoint(baseCenter, region, isTexasWide);
      break;
    default:
      coords = generateUniformPoint(baseCenter, baseSpread);
  }

  return {
    id,
    lng: coords.lng,
    lat: coords.lat,
    value: Math.random() * 100,
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    metro: metro ? metro.name : regionConfig.name,
    recyclingVolume: Math.floor(Math.random() * DATA_DEFAULTS.MAX_VOLUME) + DATA_DEFAULTS.MIN_VOLUME
  };
}

/**
 * Generate synthetic location data
 * @param {number} count - Number of points to generate
 * @param {DistributionType} distribution - Distribution algorithm
 * @param {string} region - Region identifier (e.g., 'texas', 'houston')
 * @returns {LocationData[]} Array of generated location data
 */
export function generateData(count, distribution, region) {
  const regionConfig = REGIONS[region];

  if (!regionConfig) {
    console.error(`Unknown region: ${region}`);
    return [];
  }

  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(generatePoint(i, distribution, region, regionConfig));
  }

  return data;
}

/**
 * Convert raw location data to GeoJSON FeatureCollection
 * @param {LocationData[]} data - Raw location data
 * @returns {GeoJSON.FeatureCollection}
 */
export function toGeoJSON(data) {
  return {
    type: 'FeatureCollection',
    features: data.map(d => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [d.lng, d.lat]
      },
      properties: {
        id: d.id,
        value: d.value,
        category: d.category,
        metro: d.metro,
        recyclingVolume: d.recyclingVolume
      }
    }))
  };
}

/**
 * Generate data and convert to GeoJSON in one step
 * @param {number} count
 * @param {DistributionType} distribution
 * @param {string} region
 * @returns {{raw: LocationData[], geoJSON: GeoJSON.FeatureCollection}}
 */
export function generateDataWithGeoJSON(count, distribution, region) {
  const raw = generateData(count, distribution, region);
  const geoJSON = toGeoJSON(raw);
  return { raw, geoJSON };
}

/**
 * Calculate bounds for a dataset
 * @param {LocationData[]} data
 * @returns {[[number, number], [number, number]]} [[minLng, minLat], [maxLng, maxLat]]
 */
export function calculateBounds(data) {
  if (!data || data.length === 0) {
    return null;
  }

  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  for (const point of data) {
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
  }

  return [[minLng, minLat], [maxLng, maxLat]];
}
