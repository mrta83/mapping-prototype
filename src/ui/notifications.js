/**
 * User notification utilities
 * @module ui/notifications
 */

import { TIMING } from '../config/constants.js';

/**
 * Show an auto-switch mode notification
 * @param {string} message - Notification message
 */
export function showAutoSwitchNotice(message) {
  let notice = document.getElementById('auto-switch-notice');

  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'auto-switch-notice';
    notice.style.cssText = `
      position: absolute;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--overlay-bg, rgba(0,0,0,0.8));
      color: var(--overlay-text, white);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      z-index: 100;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    `;
    document.querySelector('.map-container').appendChild(notice);
  }

  notice.textContent = message;
  notice.style.opacity = '1';

  // Fade out after delay
  setTimeout(() => {
    notice.style.opacity = '0';
  }, TIMING.NOTICE_DISPLAY_MS);
}

/**
 * Show a general toast notification
 * @param {string} message - Notification message
 * @param {'info'|'success'|'warning'|'error'} type - Notification type
 * @param {number} [duration=3000] - Display duration in ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  const colors = {
    info: 'var(--tech-secondary, #3b82f6)',
    success: 'var(--tech-accent, #00d4aa)',
    warning: 'var(--tech-warning, #f59e0b)',
    error: '#ef4444'
  };

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: var(--tech-bg-card, #0f1019);
    color: var(--tech-text, #e4e4ed);
    padding: 12px 20px;
    border-radius: 8px;
    border: 1px solid ${colors[type]};
    box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px ${colors[type]}33;
    font-size: 13px;
    font-weight: 500;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s, transform 0.3s;
  `;
  toast.textContent = message;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Update the visible points count display
 * @param {number} count
 */
export function updateVisibleCount(count) {
  const el = document.getElementById('statVisible');
  if (el) el.textContent = count;
}

/**
 * Update the total points count display
 * @param {number} count
 */
export function updateTotalCount(count) {
  const el = document.getElementById('statPoints');
  if (el) el.textContent = count;
}

/**
 * Update the zoom level display
 * @param {number} zoom
 */
export function updateZoomDisplay(zoom) {
  const el = document.getElementById('statZoom');
  if (el) el.textContent = zoom.toFixed(1);
}

/**
 * Update the filtered count display in data panel
 * @param {number} count
 */
export function updateFilteredCount(count) {
  const el = document.getElementById('filteredCountPanel');
  if (el) el.textContent = count;
}

/**
 * Update all stats displays
 * @param {Object} stats
 * @param {number} stats.total
 * @param {number} stats.visible
 * @param {number} stats.zoom
 * @param {number} [stats.filtered]
 */
export function updateStats(stats) {
  if (stats.total !== undefined) updateTotalCount(stats.total);
  if (stats.visible !== undefined) updateVisibleCount(stats.visible);
  if (stats.zoom !== undefined) updateZoomDisplay(stats.zoom);
  if (stats.filtered !== undefined) updateFilteredCount(stats.filtered);
}
