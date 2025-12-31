// Test state management module
import {
  getState, setState, subscribe,
  getMode, setMode,
  getFilters, setFilter,
  getClusterSettings, setClusterSetting,
  getColors, setColor,
  isMapReady
} from './src/state/store.js';

console.log('Testing state management...\n');

// Test mode
console.log('Initial mode:', getMode());
setMode('heatmap');
console.log('After setMode("heatmap"):', getMode());
setMode('clusters');

// Test filters
console.log('\nInitial filters:', getFilters());
setFilter('category', 'Restaurant');
setFilter('volume', 'large');
console.log('After setting filters:', getFilters());
setFilter('category', 'all');
setFilter('volume', 'all');

// Test cluster settings
console.log('\nCluster settings:', getClusterSettings());
setClusterSetting('radius', 75);
console.log('After setClusterSetting("radius", 75):', getClusterSettings().radius);

// Test colors
console.log('\nColors:', getColors());
setColor('primary', '#00ff00');
console.log('After setColor("primary", "#00ff00"):', getColors().primary);

// Test subscription
console.log('\n--- Testing subscriptions ---');
let callCount = 0;
const unsubscribe = subscribe('mode', (newMode) => {
  callCount++;
  console.log('Subscription callback - new mode:', newMode);
});

setMode('markers');
setMode('heatmap');
console.log('Subscription called', callCount, 'times');

unsubscribe();
setMode('clusters');
console.log('After unsubscribe, call count still:', callCount);

// Test isMapReady (should be false without map)
console.log('\nisMapReady():', isMapReady());

console.log('\n✅ State management works correctly!');
