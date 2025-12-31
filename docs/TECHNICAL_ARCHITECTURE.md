# Location Map Prototype - Technical Architecture

## Overview

A single-file HTML/CSS/JavaScript application built on **Mapbox GL JS v3.0.1** for visualizing geospatial location data. The prototype supports multiple visualization modes, real-time filtering, 3D features, and a custom cyberpunk-inspired UI theme.

**File**: `templates/map-prototype.html` (~3000 lines)

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Map Engine | Mapbox GL JS v3.0.1 |
| Styling | CSS3 with CSS Custom Properties |
| Fonts | Inter (UI), JetBrains Mono (data) |
| Data Format | GeoJSON |
| Storage | localStorage (API token persistence) |

---

## Architecture

### Single-File Structure

```
map-prototype.html
├── <head>
│   └── External dependencies (Mapbox, Google Fonts)
├── <style>
│   ├── CSS Variables (theming)
│   ├── Layout (sidebar, map container, panels)
│   ├── Components (controls, buttons, legend)
│   └── Glass-morphism effects
├── <body>
│   ├── Sidebar (mode-specific settings)
│   ├── Map container
│   ├── Overlays (stats, legend, mode selector)
│   └── Data panel (slide-out)
└── <script>
    ├── Configuration & State
    ├── Initialization
    ├── Data Generation
    ├── Layer Management
    ├── Mode Switching
    ├── Controls & Filters
    └── 3D Features
```

---

## State Management

Global state is managed through module-level variables:

```javascript
let map;                      // Mapbox GL Map instance
let currentMode = 'clusters'; // 'clusters' | 'heatmap' | 'markers'
let currentData = [];         // Raw generated data array
let currentGeoJSON = null;    // Transformed GeoJSON FeatureCollection
let popup;                    // Reusable Mapbox Popup instance

// Metric settings
let clusterSizeMetric = 'count';   // 'count' | 'weight'
let clusterColorMetric = 'weight'; // 'count' | 'weight'
let heatMetric = 'count';          // 'count' | 'weight'

// Filters
let volumeFilter = 'all';     // 'all' | 'small' | 'medium' | 'large'
let categoryFilter = 'all';   // 'all' | category name

// Marker settings
let currentMarkerIcon = 'recycling-bin';
let markerBaseSize = 0.8;
let scaleByVolume = true;
```

---

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  generateData() │────▶│ updateDataSource │────▶│  currentGeoJSON │
│  (synthetic)    │     │    ()            │     │  (state)        │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┘
                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ getFilteredGeo  │────▶│ rebuildForMode() │────▶│   addLayers()   │
│     JSON()      │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `generateData(count, distribution, region)` | Creates synthetic location data with configurable distribution patterns |
| `updateDataSource()` | Converts raw data to GeoJSON and initializes map source |
| `getFilteredGeoJSON()` | Applies category/volume filters to current dataset |
| `rebuildForMode()` | Removes existing layers, applies filters, rebuilds for current mode |
| `addLayers()` | Adds appropriate Mapbox layers based on `currentMode` |
| `removeAllLayers()` | Cleans up all custom layers and sources |

---

## Layer Architecture

### Source Configuration

Single GeoJSON source with conditional clustering:

```javascript
map.addSource('points', {
  type: 'geojson',
  data: filteredData,
  cluster: currentMode === 'clusters',
  clusterMaxZoom: 14,
  clusterRadius: 50,
  clusterProperties: {
    totalWeight: ['+', ['get', 'recyclingVolume']]  // Aggregation
  }
});
```

### Layer IDs by Mode

| Mode | Layers |
|------|--------|
| Clusters | `clusters-glow`, `clusters`, `cluster-count`, `unclustered-point-glow`, `unclustered-point` |
| Heatmap | `heatmap` |
| Markers | `markers`, `markers-labels` |

### Glow Effect Implementation

Glow layers render behind main layers using `circle-blur`:

```javascript
map.addLayer({
  id: 'clusters-glow',
  type: 'circle',
  paint: {
    'circle-radius': mainRadius + 18,  // Larger than main circle
    'circle-opacity': mainOpacity * 0.5,
    'circle-blur': 0.8
  }
});
```

---

## Visualization Modes

### Clusters Mode

- Uses Mapbox's built-in clustering (`cluster: true`)
- **Size**: Driven by `point_count` or `totalWeight` (aggregated)
- **Color**: Step/interpolate expressions based on count or average weight
- **Labels**: Format `{count} · {totalWeight}t`

```javascript
// Color by average weight per location
colorExpression = [
  'interpolate', ['linear'],
  ['/', ['get', 'totalWeight'], ['get', 'point_count']],
  1, primaryColor,
  5, midColor,
  10, secondaryColor
];
```

### Heatmap Mode

- Native Mapbox `heatmap` layer type
- Weight expression toggles between uniform (density) and volume-weighted

```javascript
'heatmap-weight': heatMetric === 'weight'
  ? ['interpolate', ['linear'], ['get', 'recyclingVolume'], 1, 0.1, 10, 1]
  : 1
```

### Markers Mode

- Symbol layer with custom SVG icons (loaded as images)
- Size scales by `recyclingVolume` property when enabled
- Labels appear at zoom 12+

---

## Custom Icons

SVG icons are embedded as data URIs and loaded into the map:

```javascript
function loadMarkerIcons() {
  const icons = {
    'recycling-bin': `<svg>...</svg>`,
    'wastebin': `<svg>...</svg>`,
    // ... 6 total icons
  };

  Object.entries(icons).forEach(([name, svg]) => {
    const img = new Image(32, 32);
    img.onload = () => map.addImage(name, img);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
```

---

## Style System

### CSS Custom Properties

```css
:root {
  --tech-bg-deep: #0a0a14;
  --tech-bg-card: #0f1019;
  --tech-accent: #00d4aa;
  --tech-accent-glow: rgba(0, 212, 170, 0.3);
  --tech-secondary: #3b82f6;
  /* ... */
}
```

### Glass-morphism Pattern

```css
.component {
  background: rgba(10, 10, 20, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--tech-border);
}
```

### Map Style Switching

Supports both Mapbox default styles and custom styles:

```javascript
if (style.includes('/')) {
  // Custom style: "username/styleId"
  map.setStyle(`mapbox://styles/${style}`);
} else {
  // Mapbox style: "dark-v11"
  map.setStyle(`mapbox://styles/mapbox/${style}`);
}
```

**Critical**: Style changes clear all layers. The `idle` event triggers layer rebuild:

```javascript
map.once('idle', () => {
  loadRecyclingIcon();
  setTimeout(() => rebuildForMode(), 150);
});
```

---

## 3D Features

### 3D Buildings

Adds `fill-extrusion` layer using Mapbox's composite building source:

```javascript
map.addLayer({
  id: '3d-buildings',
  source: 'composite',
  'source-layer': 'building',
  type: 'fill-extrusion',
  paint: {
    'fill-extrusion-height': ['get', 'height'],
    'fill-extrusion-base': ['get', 'min_height']
  }
});
```

### 3D Terrain

Uses Mapbox DEM tiles with configurable exaggeration:

```javascript
map.addSource('mapbox-dem', {
  type: 'raster-dem',
  url: 'mapbox://mapbox.mapbox-terrain-dem-v1'
});

map.setTerrain({
  source: 'mapbox-dem',
  exaggeration: 1.5
});
```

---

## Event Handling

### Map Events

| Event | Handler | Purpose |
|-------|---------|---------|
| `load` | `initMap()` callback | Initial data generation |
| `idle` | Style change handler | Rebuild layers after style switch |
| `zoomend` | `checkAutoSwitchMode()` | Auto-switch markers↔clusters |
| `moveend` | `updateStats()` | Update visible count |

### Auto Mode Switching

```javascript
const AUTO_SWITCH_ZOOM_THRESHOLD = 8.0;

function checkAutoSwitchMode() {
  if (currentMode === 'markers' && zoom < threshold) {
    setMode('clusters', true);  // isAutoSwitch = true
  }
}
```

### Layer Interactions

- **Cluster click**: Zoom to cluster expansion level
- **Point hover**: Show popup with location details
- **Cursor change**: Pointer on interactive features

---

## Data Generation

### Distribution Algorithms

| Type | Algorithm |
|------|-----------|
| `clustered` | Gaussian clustering around random neighborhood centers |
| `uniform` | Random uniform distribution within region bounds |
| `route` | Points along I-35 corridor with noise |
| `coastal` | Biased toward Gulf Coast (Houston) or ring roads (other cities) |

### Texas Metro Weighting

```javascript
const TEXAS_METROS = [
  { name: 'Houston', center: [...], weight: 0.35 },
  { name: 'Dallas-Fort Worth', center: [...], weight: 0.30 },
  { name: 'San Antonio', center: [...], weight: 0.18 },
  { name: 'Austin', center: [...], weight: 0.17 }
];
```

---

## Performance Considerations

1. **Layer rebuilding**: `rebuildForMode()` is called frequently; performs full layer teardown/rebuild
2. **Opacity updates**: Use `setPaintProperty()` for live updates without rebuild
3. **Filter application**: Client-side filtering of GeoJSON features
4. **Icon loading**: Async image loading with callbacks
5. **Style switching**: 150ms delay after `idle` event for stability

---

## Key Code Patterns

### Guard Clauses

```javascript
function rebuildForMode() {
  if (!map || !map.isStyleLoaded() || !currentGeoJSON) return;
  // ...
}
```

### Color Interpolation

```javascript
function mixColors(c1, c2, ratio) {
  // Hex to RGB, linear interpolation, back to hex
}
```

### Expression-based Styling

Heavy use of Mapbox expressions for data-driven styling:
- `['get', 'propertyName']`
- `['step', value, ...stops]`
- `['interpolate', ['linear'], value, ...stops]`
- `['coalesce', expr1, fallback]`

---

## Extension Points

| Area | How to Extend |
|------|---------------|
| New visualization mode | Add to `setMode()`, create layer builder in `addLayers()` |
| New data source | Replace `generateData()` with API fetch, maintain GeoJSON structure |
| Additional filters | Add filter state, update `getFilteredGeoJSON()`, add UI controls |
| New marker icons | Add SVG to `loadMarkerIcons()`, add button to icon picker |
| Custom map style | Add style ID to dropdown, works automatically |

---

## Known Limitations

1. **Single file**: No module system; all code in one file
2. **Synthetic data only**: No real data integration
3. **No state persistence**: Filters/settings reset on reload (except API token)
4. **Client-side filtering**: Large datasets may impact performance
5. **Hardcoded regions**: Texas-specific metro areas

---

## Dependencies

```html
<script src="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js"></script>
<link href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css">
<link href="https://fonts.googleapis.com/css2?family=Inter&family=JetBrains+Mono">
```

**Required**: Valid Mapbox access token with:
- Map Loads
- Geocoding (if extended)
- Terrain API (for 3D terrain)
