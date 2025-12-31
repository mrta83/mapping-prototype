// Test layer builder modules
import { createClusterLayers } from './src/layers/clusters.js';
import { createHeatmapLayers } from './src/layers/heatmap.js';
import { createMarkerLayers } from './src/layers/markers.js';

console.log('Testing layer builders...\n');

// Test cluster layers
const clusterConfig = {
  primary: '#3b82f6',
  secondary: '#ef4444',
  sizeMetric: 'count',
  colorMetric: 'weight',
  opacity: 0.8
};

const clusterLayers = createClusterLayers(clusterConfig);
console.log('✓ Cluster layers created:', clusterLayers.length, 'layers');
clusterLayers.forEach(l => console.log('  -', l.id, `(${l.type})`));

// Test heatmap layers
const heatmapConfig = {
  metric: 'weight',
  intensity: 1.0,
  radius: 20,
  opacity: 0.8
};

const heatmapLayers = createHeatmapLayers(heatmapConfig);
console.log('\n✓ Heatmap layers created:', heatmapLayers.length, 'layers');
heatmapLayers.forEach(l => console.log('  -', l.id, `(${l.type})`));

// Test marker layers
const markerConfig = {
  icon: 'recycling-bin',
  baseSize: 0.8,
  scaleByVolume: true
};

const markerLayers = createMarkerLayers(markerConfig);
console.log('\n✓ Marker layers created:', markerLayers.length, 'layers');
markerLayers.forEach(l => console.log('  -', l.id, `(${l.type})`));

console.log('\n✅ All layer builders work correctly!');
