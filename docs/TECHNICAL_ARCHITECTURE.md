# Location Map Prototype - Technical Architecture

## Overview

A modular ES6 JavaScript application built on **Mapbox GL JS v3.0.1** for visualizing geospatial location data. The prototype supports multiple visualization modes, real-time filtering, 3D features, and a custom cyberpunk-inspired UI theme.

**Entry Point**: `templates/map-prototype-modular.html`
**Main Module**: `src/main.js`
**Architecture**: 17 ES Modules with centralized state management

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Map Engine | Mapbox GL JS v3.0.1 |
| Module System | ES Modules (native browser) |
| Styling | CSS3 with CSS Custom Properties |
| Fonts | Inter (UI), JetBrains Mono (data) |
| Data Format | GeoJSON |
| Storage | localStorage (token + state persistence) |

---

## Architecture

### Module Structure

```
src/
├── config/
│   ├── constants.js      # Timing, zoom thresholds, layer IDs, defaults
│   └── regions.js        # Geographic regions, Texas metros, categories
├── state/
│   ├── store.js          # Centralized state with pub/sub, validation, persistence
│   └── selectors.js      # Memoized derived state computations
├── utils/
│   ├── colors.js         # Color manipulation (mix, lighten, hex↔rgb)
│   └── icons.js          # SVG icon definitions and loader
├── layers/
│   ├── clusters.js       # Cluster layer factory
│   ├── heatmap.js        # Heatmap layer factory
│   ├── markers.js        # Marker layer factory
│   └── index.js          # Layer management (add/remove/rebuild)
├── data/
│   └── generator.js      # Synthetic data generation with distributions
├── ui/
│   ├── controls.js       # UI control event handlers
│   ├── legend.js         # Dynamic legend rendering
│   └── notifications.js  # Stats, toasts, filter notices
├── map/
│   ├── interactions.js   # Click, hover, cursor handlers
│   ├── style.js          # Map style management
│   └── threeD.js         # 3D buildings and terrain
└── main.js               # Application entry point
```

### Module Dependencies

```
main.js
├── config/constants.js
├── config/regions.js
├── state/store.js
├── state/selectors.js
├── data/generator.js
├── layers/index.js
│   ├── layers/clusters.js
│   ├── layers/heatmap.js
│   └── layers/markers.js
├── ui/controls.js
├── ui/legend.js
├── ui/notifications.js
├── map/interactions.js
├── map/style.js
└── map/threeD.js
```

---

## State Management

### Centralized Store (`state/store.js`)

All application state flows through a single store with pub/sub notifications:

```javascript
const state = {
  // Core instances
  map: null,                    // Mapbox GL Map instance
  popup: null,                  // Reusable Popup instance

  // Visualization
  mode: 'clusters',             // 'clusters' | 'heatmap' | 'markers'

  // Data
  rawData: [],                  // Generated location objects
  geoJSON: null,                // FeatureCollection for map

  // Settings per mode
  filters: { volume: 'all', category: 'all' },
  cluster: { sizeMetric, colorMetric, radius, maxZoom, opacity },
  heatmap: { metric, intensity, radius, opacity },
  markers: { icon, baseSize, scaleByVolume },
  colors: { primary: '#3b82f6', secondary: '#ef4444' }
};
```

### State API

| Function | Purpose |
|----------|---------|
| `getState(key)` | Get value by key (supports dot notation: `'cluster.radius'`) |
| `setState(key, value)` | Set value, triggers subscribers |
| `subscribe(key, callback)` | Subscribe to changes, returns unsubscribe function |
| `batch(updateFn)` | Batch multiple updates, single notification |
| `setMultiple(updates)` | Update multiple keys at once |

### State Validation

Values are validated before being set:

```javascript
const validators = {
  'mode': (v) => ['clusters', 'heatmap', 'markers'].includes(v),
  'cluster.opacity': (v) => typeof v === 'number' && v >= 0 && v <= 1,
  'cluster.radius': (v) => typeof v === 'number' && v >= 10 && v <= 200,
  'colors.primary': (v) => /^#[0-9A-Fa-f]{6}$/.test(v),
  // ...
};

// Validates before setting
setStateValidated('cluster.opacity', 0.5);  // Returns true
setStateValidated('cluster.opacity', 1.5);  // Returns false, logs warning
```

### State Persistence

Settings automatically persist to localStorage:

```javascript
// On init
restoreState();           // Loads saved mode, filters, colors, etc.
enableAutoPersist();      // Auto-save on changes (debounced 1s)

// Manual control
persistState();           // Save now
clearPersistedState();    // Clear saved state
```

### Debugging Utilities

```javascript
// Enable history tracking (add ?debug to URL)
enableHistory();
getHistory(10);           // Last 10 state changes

// Snapshot current state
getSnapshot();            // { mode, filters, colors, ... }

// Console debugging
debugState();             // Logs full state to console
```

---

## Selectors (`state/selectors.js`)

Memoized functions for derived state. Results are cached until dependencies change.

| Selector | Returns | Dependencies |
|----------|---------|--------------|
| `getFilteredData()` | Filtered raw data array | rawData, filters |
| `getFilteredCount()` | Number of filtered items | rawData, filters |
| `getFilteredGeoJSON()` | GeoJSON FeatureCollection | rawData, filters |
| `getActiveLayerIds()` | Layer IDs for current mode | mode |
| `getCurrentLayerConfig()` | Merged config for mode | mode, settings, colors |
| `getDataStats()` | Statistics object | rawData, filters |
| `hasActiveFilters()` | Boolean | filters |
| `getFilteredBounds()` | [[sw], [ne]] bounds | rawData, filters |

### Memoization Pattern

```javascript
function createSelector(computeFn, dependencyFn) {
  let cached = null;
  let cachedDeps = null;

  return () => {
    const deps = dependencyFn();
    if (depsEqual(deps, cachedDeps)) return cached;

    cachedDeps = deps;
    cached = computeFn();
    return cached;
  };
}

// Usage
export const getFilteredCount = createSelector(
  () => getFilteredData().length,
  () => [getRawData(), getFilters().volume, getFilters().category]
);
```

---

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ generateData()  │────▶│   setRawData()   │────▶│   state.raw     │
│ (generator.js)  │     │   setGeoJSON()   │     │   state.geoJSON │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
              ┌───────────────────────────────────────────┘
              ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ getFiltered     │────▶│ rebuildForMode() │────▶│   addLayers()   │
│   GeoJSON()     │     │ (layers/index)   │     │   (factories)   │
│ (selectors.js)  │     └──────────────────┘     └─────────────────┘
└─────────────────┘              │
                                 ▼
                    ┌──────────────────────┐
                    │ notify('mode', ...)  │
                    │ → UI updates         │
                    │ → legend rebuild     │
                    └──────────────────────┘
```

---

## Layer Factories

Each visualization mode has a dedicated factory in `src/layers/`:

### Cluster Factory (`layers/clusters.js`)

```javascript
export function createClusterLayers(config) {
  return [
    createClusterGlowLayer(config),    // Background glow
    createClusterLayer(config),         // Main circles
    createClusterCountLayer(),          // Text labels
    createUnclusteredGlowLayer(config), // Single point glow
    createUnclusteredPointLayer(config) // Single points
  ];
}
```

### Heatmap Factory (`layers/heatmap.js`)

```javascript
export function createHeatmapLayers(config) {
  return [{
    id: LAYER_IDS.HEATMAP,
    type: 'heatmap',
    paint: {
      'heatmap-weight': buildWeightExpression(config.metric),
      'heatmap-intensity': config.intensity,
      'heatmap-radius': config.radius,
      'heatmap-opacity': config.opacity,
      'heatmap-color': buildGradient()
    }
  }];
}
```

### Marker Factory (`layers/markers.js`)

```javascript
export function createMarkerLayers(config) {
  return [
    createMarkerGlowLayer(config),  // Glow effect
    createMarkerLayer(config)       // Symbol layer
  ];
}
```

---

## Layer Management (`layers/index.js`)

| Function | Purpose |
|----------|---------|
| `rebuildForMode()` | Main rebuild function - removes layers, applies filters, adds new layers |
| `removeAllLayers()` | Cleans up all custom layers and sources |
| `addSource(map, data)` | Adds GeoJSON source with clustering config |
| `addLayers(map)` | Calls appropriate factory for current mode |
| `updateLayerPaint()` | Updates paint property without full rebuild |
| `updateClusterOpacity()` | Batch opacity update for cluster layers |
| `updateHeatmapProperties()` | Live heatmap property updates |

---

## Pub/Sub Event Flow

```javascript
// Component subscribes to state changes
subscribe('mode', (newMode) => {
  updateLegend();
  updateModeUI(newMode);
});

subscribe('filters', (filters) => {
  rebuildForMode();
  updateFilteredCount(getFilteredCount());
});

// Wildcard subscription for persistence
subscribe('*', ({ key, value }) => {
  debouncedPersist();
});
```

---

## 3D Features

### 3D Buildings (`map/threeD.js`)

```javascript
export function add3DBuildings(map) {
  map.addLayer({
    id: LAYER_IDS.BUILDINGS_3D,
    source: 'composite',
    'source-layer': 'building',
    type: 'fill-extrusion',
    paint: {
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 0.6
    }
  });
}
```

### 3D Terrain

```javascript
export function enableTerrain(map, exaggeration = 1.5) {
  map.addSource(SOURCE_IDS.DEM, {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1'
  });

  map.setTerrain({ source: SOURCE_IDS.DEM, exaggeration });
}
```

---

## Configuration Constants

All magic numbers extracted to `config/constants.js`:

```javascript
export const TIMING = {
  STYLE_SETTLE_MS: 150,
  FLY_DURATION_MS: 1500,
  DEBOUNCE_MS: 100
};

export const ZOOM = {
  AUTO_SWITCH_THRESHOLD: 8.0,
  CLUSTER_MAX: 14,
  LABELS_MIN: 12
};

export const CLUSTER_DEFAULTS = {
  RADIUS: 50,
  MAX_ZOOM: 14,
  OPACITY: 0.8
};

export const LAYER_IDS = {
  CLUSTERS: 'clusters',
  CLUSTERS_GLOW: 'clusters-glow',
  // ...
};
```

---

## Extension Points

| Area | How to Extend |
|------|---------------|
| New visualization mode | Create factory in `layers/`, add case to `createLayersForMode()` |
| New data source | Replace `generateData()` in `data/generator.js`, maintain GeoJSON structure |
| Additional filters | Add to `state.filters`, update selectors, add UI in `ui/controls.js` |
| New marker icons | Add SVG to `utils/icons.js`, add to icon picker UI |
| Custom state | Add to store, create typed getter/setter, add validator if needed |
| Derived data | Add memoized selector to `state/selectors.js` |

---

## Performance Optimizations

1. **Memoized selectors**: Filtered data cached until dependencies change (~4x speedup)
2. **Batch updates**: Multiple state changes trigger single notification
3. **Paint property updates**: Use `updateLayerPaint()` for live slider changes
4. **Debounced persistence**: State saved 1s after last change
5. **Layer factory pattern**: Layers built once per mode switch

---

## Debugging

### Debug Mode

Add `?debug` to URL to enable:
- State history tracking
- `window.debugState()` function
- Console logging of state changes

### State Inspection

```javascript
// In browser console
debugState();              // Full state dump
getSnapshot();             // Current values
getHistory(5);             // Recent changes
```

---

## Known Limitations

1. ~~Single file~~ → **Resolved**: 17 ES modules
2. ~~No state persistence~~ → **Resolved**: localStorage with auto-persist
3. **Synthetic data only**: No real data integration yet
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
