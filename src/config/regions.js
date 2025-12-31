/**
 * Geographic region configuration and constants
 * @module config/regions
 */

/**
 * Region configuration with center coordinates and zoom levels
 * @type {Object.<string, {center: [number, number], zoom: number, name: string}>}
 */
export const REGIONS = {
  texas: { center: [-99.5, 31.0], zoom: 5.5, name: 'Texas (All)' },
  houston: { center: [-95.3698, 29.7604], zoom: 10, name: 'Houston' },
  dallas: { center: [-96.7970, 32.7767], zoom: 10, name: 'Dallas-Fort Worth' },
  austin: { center: [-97.7431, 30.2672], zoom: 11, name: 'Austin' },
  sanantonio: { center: [-98.4936, 29.4241], zoom: 11, name: 'San Antonio' }
};

/**
 * Texas metro areas with population weights for data distribution
 * @type {Array<{name: string, center: [number, number], weight: number, spread: number}>}
 */
export const TEXAS_METROS = [
  { name: 'Houston', center: [-95.3698, 29.7604], weight: 0.35, spread: 0.4 },
  { name: 'Dallas-Fort Worth', center: [-96.7970, 32.7767], weight: 0.30, spread: 0.5 },
  { name: 'San Antonio', center: [-98.4936, 29.4241], weight: 0.18, spread: 0.25 },
  { name: 'Austin', center: [-97.7431, 30.2672], weight: 0.17, spread: 0.2 }
];

/**
 * Location categories for data generation
 * @type {string[]}
 */
export const CATEGORIES = ['Restaurant', 'Shop', 'Office', 'Park', 'Transit'];

/**
 * Volume filter ranges in tons/month
 * @type {Object.<string, {min: number, max: number, label: string}>}
 */
export const VOLUME_RANGES = {
  all: { min: 1, max: 10, label: 'All volumes' },
  small: { min: 1, max: 3, label: '1-3t' },
  medium: { min: 4, max: 6, label: '4-6t' },
  large: { min: 7, max: 10, label: '7-10t' }
};
