# Location Map Prototype - User Guide

A futuristic mapping tool for visualizing recycling location data with multiple view modes, customizable styling, and interactive controls.

---

## Getting Started

1. Open `map-prototype.html` in a browser
2. Enter your Mapbox access token when prompted (saved locally for future use)
3. The map loads with sample data in your selected region

---

## View Modes

Switch between three visualization modes using the **View Mode** panel (bottom-right of map):

| Mode | Best For |
|------|----------|
| **Clusters** | Overview of location density. Points group into circles sized by count or weight. Click clusters to zoom in. |
| **Heatmap** | Identifying hotspots. Color intensity shows concentration of locations or total recycling volume. |
| **Markers** | Individual location details. Each point displays as an icon. Click for location info popup. |

---

## Map Styles & 3D

**Map Style** - Choose from Cyber (default), Dark, Light, Streets, Satellite, Outdoors, or 3D Standard.

**3D Features** (in View Mode panel):
- **3D Buildings** - Extruded building footprints in supported areas
- **3D Terrain** - Elevation with adjustable exaggeration (0.5x - 3x)

---

## Data Panel

Click the **arrow tab** on the right edge to open the Data Panel:

### Generation
- **Point Count** - 10 to 10,000 sample locations
- **Distribution** - Clustered (neighborhoods), Uniform (spread), I-35 Corridor, or Houston Coast/City Loops
- **Region** - Texas (all), Houston, Dallas-Fort Worth, Austin, or San Antonio
- **Regenerate Data** - Create new random dataset

### Filters
- **Category** - All, Restaurant, Shop, Office, Park, or Transit
- **Volume** - All, Small (1-3t), Medium (4-6t), or Large (7-10t)

### Actions
- **Fit to Data** - Zoom to show all visible points
- **Reset View** - Return to region's default center and zoom

---

## Sidebar Controls

The left sidebar provides mode-specific settings:

### Cluster Settings
| Control | Description |
|---------|-------------|
| Size Represents | Circle size based on location count or total weight |
| Color Represents | Circle color based on location count or average weight |
| Cluster Radius | How close points must be to group (20-100px) |
| Max Zoom | Zoom level where clusters break apart (8-18) |
| Opacity | Cluster transparency (0.1-1.0) |

### Marker Settings
| Control | Description |
|---------|-------------|
| Marker Icon | Choose from 6 icons (recycling, waste bin, leaf, pin, factory, poop) |
| Icon Size | Scale markers (0.4x - 1.5x) |
| Scale by Volume | Larger icons for higher-volume locations |

### Heatmap Settings
| Control | Description |
|---------|-------------|
| Heat Represents | Color by location density or total weight |
| Intensity | Strength of heat visualization (0.1-2.0) |
| Radius | Size of heat around each point (5-50px) |
| Opacity | Heatmap transparency (0.1-1.0) |

### Colors
Customize the primary and secondary colors used across all visualization modes. The gradient flows from primary (low values) to secondary (high values).

---

## Stats & Legend

**Stats** (top-left): Shows total points, currently visible count, and zoom level.

**Legend** (bottom-left): Displays the current color scale with value ranges. Updates automatically when you change modes, metrics, or colors.

---

## Tips

- **Collapse sidebar** - Click the chevron tab on the sidebar edge for more map space
- **Click clusters** - Zoom into clustered areas for more detail
- **Click markers** - View location name, category, and recycling volume
- **Pan/zoom** - Standard map controls; scroll to zoom, drag to pan
- **Navigation controls** - Top-right corner has zoom buttons and compass
