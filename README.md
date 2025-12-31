# Mapping Prototype

Interactive map visualization prototype built with Mapbox GL JS. Features multiple visualization modes, real-time filtering, and a modern "techy" UI theme.

## Features

- **Visualization Modes**: Clusters, Heatmap, Custom Markers
- **Filtering**: By category and volume
- **Styling**: Light/Dark/Satellite with custom Mapbox styles
- **3D**: Terrain and building extrusion support
- **Responsive**: Works on desktop and mobile

## Quick Start

1. Get a [Mapbox Access Token](https://account.mapbox.com/access-tokens/)
2. Serve the project locally:
   ```bash
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080/templates/map-prototype-modular.html`
4. Enter your Mapbox token when prompted

## Project Structure

```
├── src/
│   ├── config/        # Constants, regions, defaults
│   ├── state/         # State management & selectors
│   ├── utils/         # Colors, icons utilities
│   ├── layers/        # Mapbox layer factories
│   ├── data/          # Data generation
│   ├── ui/            # Controls, legend, notifications
│   ├── map/           # Interactions, style, 3D
│   └── main.js        # Entry point
├── templates/
│   └── map-prototype-modular.html
├── docs/
│   ├── BACKLOG.md
│   ├── MAP_USER_GUIDE.md
│   └── TECHNICAL_ARCHITECTURE.md
└── test-*.mjs         # Module tests
```

## Architecture

- **ES Modules**: Clean separation into 17 modules
- **State Management**: Centralized store with pub/sub, validation, persistence
- **Memoized Selectors**: Efficient derived state computation
- **Factory Pattern**: Layer builders for each visualization mode

## Development

Run module tests:
```bash
node test-imports.mjs
node test-layers.mjs
node test-state.mjs
node test-enhanced-state.mjs
```

## Tech Stack

- Mapbox GL JS v3.0.1
- Vanilla JavaScript (ES Modules)
- CSS3 with custom properties

## License

MIT
