/**
 * SVG icon definitions for map markers
 * @module utils/icons
 */

/**
 * SVG icon definitions
 * @type {Object.<string, string>}
 */
export const ICONS = {
  'recycling-bin': `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect x="6" y="10" width="20" height="18" rx="2" fill="#2E7D32" stroke="#1B5E20" stroke-width="1"/>
      <rect x="4" y="7" width="24" height="4" rx="1" fill="#43A047" stroke="#2E7D32" stroke-width="1"/>
      <rect x="13" y="4" width="6" height="4" rx="1" fill="#66BB6A"/>
      <g transform="translate(16, 20)" fill="white">
        <path d="M-4,-5 L0,-8 L4,-5 L2,-5 L2,-2 L-2,-2 L-2,-5 Z" transform="rotate(0)"/>
        <path d="M-4,-5 L0,-8 L4,-5 L2,-5 L2,-2 L-2,-2 L-2,-5 Z" transform="rotate(120)"/>
        <path d="M-4,-5 L0,-8 L4,-5 L2,-5 L2,-2 L-2,-2 L-2,-5 Z" transform="rotate(240)"/>
      </g>
    </svg>
  `,

  'wastebin': `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect x="7" y="10" width="18" height="18" rx="2" fill="#546E7A" stroke="#37474F" stroke-width="1"/>
      <rect x="5" y="7" width="22" height="4" rx="1" fill="#78909C" stroke="#546E7A" stroke-width="1"/>
      <rect x="13" y="4" width="6" height="4" rx="1" fill="#90A4AE"/>
      <line x1="11" y1="14" x2="11" y2="24" stroke="#37474F" stroke-width="1.5"/>
      <line x1="16" y1="14" x2="16" y2="24" stroke="#37474F" stroke-width="1.5"/>
      <line x1="21" y1="14" x2="21" y2="24" stroke="#37474F" stroke-width="1.5"/>
    </svg>
  `,

  'poop': `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <ellipse cx="16" cy="26" rx="10" ry="4" fill="#5D4037"/>
      <ellipse cx="16" cy="20" rx="8" ry="5" fill="#6D4C41"/>
      <ellipse cx="16" cy="14" rx="6" ry="4" fill="#795548"/>
      <ellipse cx="16" cy="9" rx="4" ry="3" fill="#8D6E63"/>
      <circle cx="12" cy="18" r="1.5" fill="#3E2723"/>
      <circle cx="20" cy="18" r="1.5" fill="#3E2723"/>
      <path d="M13 22 Q16 24 19 22" stroke="#3E2723" stroke-width="1.5" fill="none"/>
    </svg>
  `,

  'leaf': `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <path d="M16 4 C8 8 6 16 8 24 C10 20 14 18 16 18 C18 18 22 20 24 24 C26 16 24 8 16 4" fill="#4CAF50" stroke="#2E7D32" stroke-width="1"/>
      <path d="M16 8 L16 24" stroke="#2E7D32" stroke-width="1.5"/>
      <path d="M16 12 L12 16" stroke="#2E7D32" stroke-width="1"/>
      <path d="M16 16 L20 20" stroke="#2E7D32" stroke-width="1"/>
    </svg>
  `,

  'pin': `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <path d="M16 2 C10 2 6 7 6 12 C6 20 16 30 16 30 C16 30 26 20 26 12 C26 7 22 2 16 2" fill="#E53935" stroke="#B71C1C" stroke-width="1"/>
      <circle cx="16" cy="12" r="5" fill="white"/>
    </svg>
  `,

  'factory': `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect x="4" y="16" width="24" height="12" fill="#607D8B" stroke="#455A64" stroke-width="1"/>
      <rect x="6" y="8" width="6" height="20" fill="#78909C"/>
      <rect x="14" y="12" width="5" height="16" fill="#78909C"/>
      <rect x="8" y="4" width="2" height="6" fill="#90A4AE"/>
      <rect x="16" y="6" width="2" height="8" fill="#90A4AE"/>
      <ellipse cx="9" cy="3" rx="3" ry="2" fill="#B0BEC5" opacity="0.7"/>
      <ellipse cx="17" cy="5" rx="2.5" ry="1.5" fill="#B0BEC5" opacity="0.7"/>
      <rect x="7" y="20" width="3" height="4" fill="#FFC107"/>
      <rect x="14" y="20" width="3" height="4" fill="#FFC107"/>
      <rect x="21" y="20" width="3" height="4" fill="#FFC107"/>
    </svg>
  `
};

/**
 * Icon emoji mapping for UI display
 * @type {Object.<string, string>}
 */
export const ICON_EMOJIS = {
  'recycling-bin': '♻️',
  'wastebin': '🗑️',
  'poop': '💩',
  'leaf': '🌿',
  'pin': '📍',
  'factory': '🏭'
};

/**
 * Icon display names
 * @type {Object.<string, string>}
 */
export const ICON_NAMES = {
  'recycling-bin': 'Recycling Bin',
  'wastebin': 'Waste Bin',
  'poop': 'Poop',
  'leaf': 'Eco Leaf',
  'pin': 'Map Pin',
  'factory': 'Factory'
};

/**
 * Load all marker icons into a Mapbox map instance
 * @param {mapboxgl.Map} map - The map instance
 * @returns {Promise<void>} Resolves when all icons are loaded
 */
export function loadMarkerIcons(map) {
  const promises = Object.entries(ICONS).map(([name, svgString]) => {
    return new Promise((resolve, reject) => {
      if (map.hasImage(name)) {
        resolve();
        return;
      }

      const img = new Image(32, 32);

      img.onload = () => {
        if (!map.hasImage(name)) {
          map.addImage(name, img);
        }
        resolve();
      };

      img.onerror = () => {
        console.error(`Failed to load icon: ${name}`);
        reject(new Error(`Failed to load icon: ${name}`));
      };

      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString.trim());
    });
  });

  return Promise.all(promises);
}

/**
 * Get list of available icon names
 * @returns {string[]}
 */
export function getAvailableIcons() {
  return Object.keys(ICONS);
}
