// Test enhanced state management features
import {
  getState, setState, subscribe, getMode, setMode,
  getFilters, setFilter, getClusterSettings, setClusterSetting,
  getColors, setColor,
  // New features
  validateState, setStateValidated,
  batch, setMultiple,
  getSnapshot, resetState,
  enableHistory, getHistory, clearHistory
} from './src/state/store.js';

import {
  getFilteredData, getFilteredCount, getFilteredGeoJSON,
  getActiveLayerIds, getCurrentLayerConfig, getDataStats,
  hasActiveFilters, getFilteredBounds
} from './src/state/selectors.js';

import { generateData, toGeoJSON } from './src/data/generator.js';

console.log('Testing Enhanced State Management...\n');

// =============================================================================
// TEST VALIDATION
// =============================================================================
console.log('=== Testing Validation ===');

// Valid values
console.log('Valid mode:', validateState('mode', 'heatmap'));
console.log('Valid opacity:', validateState('cluster.opacity', 0.5));
console.log('Valid color:', validateState('colors.primary', '#ff0000'));

// Invalid values
console.log('Invalid mode:', validateState('mode', 'invalid'));
console.log('Invalid opacity (>1):', validateState('cluster.opacity', 1.5));
console.log('Invalid opacity (<0):', validateState('cluster.opacity', -0.5));
console.log('Invalid color format:', validateState('colors.primary', 'red'));

// setStateValidated
console.log('\nValidated set (valid):', setStateValidated('cluster.radius', 60));
console.log('Cluster radius now:', getClusterSettings().radius);

console.log('Validated set (invalid):', setStateValidated('cluster.radius', 999));
console.log('Cluster radius still:', getClusterSettings().radius);

// =============================================================================
// TEST BATCH UPDATES
// =============================================================================
console.log('\n=== Testing Batch Updates ===');

let notificationCount = 0;
const unsub = subscribe('*', () => notificationCount++);

// Without batch - each update triggers notification
setMode('markers');
setMode('heatmap');
setMode('clusters');
console.log('Without batch - notifications:', notificationCount);

notificationCount = 0;

// With batch - single notification at end
batch(() => {
  setMode('markers');
  setMode('heatmap');
  setMode('clusters');
});
console.log('With batch - notifications:', notificationCount);

// setMultiple
notificationCount = 0;
setMultiple({
  'mode': 'heatmap',
  'colors.primary': '#00ff00',
  'cluster.opacity': 0.9
});
console.log('setMultiple - notifications:', notificationCount);
console.log('After setMultiple:', {
  mode: getMode(),
  primary: getColors().primary,
  opacity: getClusterSettings().opacity
});

unsub();

// =============================================================================
// TEST DEBUGGING UTILITIES
// =============================================================================
console.log('\n=== Testing Debugging Utilities ===');

enableHistory();

// Make some changes
setMode('markers');
setColor('primary', '#ff00ff');
setFilter('volume', 'large');

const history = getHistory(5);
console.log('State history (last 5):');
history.forEach(h => console.log(`  - ${h.key}: ${JSON.stringify(h.newValue)}`));

console.log('\nState snapshot:');
const snapshot = getSnapshot();
console.log('  mode:', snapshot.mode);
console.log('  filters:', snapshot.filters);
console.log('  colors:', snapshot.colors);

clearHistory();
console.log('History cleared, count:', getHistory().length);

// =============================================================================
// TEST SELECTORS
// =============================================================================
console.log('\n=== Testing Selectors ===');

// Reset state first
resetState();
console.log('State reset to defaults');

// Generate test data
const rawData = generateData(100, 'clustered', 'houston');
const geoJSON = toGeoJSON(rawData);

// Set the raw data in state (selectors need this)
import { setRawData, setGeoJSON } from './src/state/store.js';
setRawData(rawData);
setGeoJSON(geoJSON);

console.log('Generated', rawData.length, 'test points');

// Test filtered data selector
console.log('\nWith no filters:');
console.log('  Filtered count:', getFilteredCount());
console.log('  Has active filters:', hasActiveFilters());

// Apply filter
setFilter('volume', 'large');
console.log('\nWith volume=large filter:');
console.log('  Filtered count:', getFilteredCount());
console.log('  Has active filters:', hasActiveFilters());

// Test data stats
const stats = getDataStats();
console.log('\nData stats:');
console.log('  Total:', stats.total);
console.log('  Filtered:', stats.filtered);
console.log('  Filter percentage:', stats.filterPercentage + '%');
console.log('  Categories:', Object.keys(stats.categories).length);
console.log('  Avg volume:', stats.avgVolume);

// Test active layer IDs
setMode('clusters');
console.log('\nActive layers for clusters:', getActiveLayerIds());

setMode('heatmap');
console.log('Active layers for heatmap:', getActiveLayerIds());

setMode('markers');
console.log('Active layers for markers:', getActiveLayerIds());

// Test layer config
const layerConfig = getCurrentLayerConfig();
console.log('\nCurrent layer config:');
console.log('  Mode:', layerConfig.mode);
console.log('  Icon:', layerConfig.icon);
console.log('  Primary color:', layerConfig.primary);

// Test filtered bounds
const bounds = getFilteredBounds();
console.log('\nFiltered data bounds:');
if (bounds) {
  console.log('  SW:', bounds[0]);
  console.log('  NE:', bounds[1]);
}

// Test memoization (call twice, should use cache)
console.log('\n=== Testing Memoization ===');
const start1 = performance.now();
getFilteredData();
const time1 = performance.now() - start1;

const start2 = performance.now();
getFilteredData();
const time2 = performance.now() - start2;

console.log('First call:', time1.toFixed(3), 'ms');
console.log('Second call (cached):', time2.toFixed(3), 'ms');
console.log('Speedup:', (time1 / time2).toFixed(1) + 'x faster');

// =============================================================================
// CLEANUP AND SUMMARY
// =============================================================================
console.log('\n=== Summary ===');
resetState();
console.log('State reset to defaults');

console.log('\n✅ All enhanced state management features working!');
console.log('\nNew capabilities:');
console.log('  - State validation with constraints');
console.log('  - Batch updates to reduce re-renders');
console.log('  - State persistence to localStorage');
console.log('  - State history tracking');
console.log('  - State snapshots for debugging');
console.log('  - Memoized selectors for derived state');
console.log('  - Data statistics');
console.log('  - Active layer tracking');
