// Test ES module imports
import { REGIONS, TEXAS_METROS, CATEGORIES, VOLUME_RANGES } from './src/config/regions.js';
import { TIMING, ZOOM, MODES, LAYER_IDS, MAP_STYLES } from './src/config/constants.js';
import { mixColors, hexToRgb, lighten } from './src/utils/colors.js';
import { ICONS, ICON_EMOJIS, getAvailableIcons } from './src/utils/icons.js';
import { generateData, toGeoJSON, calculateBounds } from './src/data/generator.js';

// Test basic functionality
console.log('✓ Config modules imported');
console.log('  - REGIONS:', Object.keys(REGIONS).length, 'regions');
console.log('  - TEXAS_METROS:', TEXAS_METROS.length, 'metros');
console.log('  - MODES:', Object.values(MODES).join(', '));

console.log('✓ Color utils imported');
console.log('  - mixColors test:', mixColors('#ff0000', '#0000ff', 0.5));

console.log('✓ Icons imported');
console.log('  - Available icons:', getAvailableIcons().length);

console.log('✓ Data generator imported');
const data = generateData(10, 'clustered', 'houston');
console.log('  - Generated', data.length, 'points');
const geojson = toGeoJSON(data);
console.log('  - GeoJSON features:', geojson.features.length);

console.log('\n✅ All module imports successful!');
