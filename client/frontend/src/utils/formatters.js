// Utility formatters for Currency and Dates

/**
 * Format a number as Indian Rupee currency (INR)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Format date string into human readable format: e.g. "Sep 3, 2026 • 8:42 PM"
 * Handles ISO strings, timestamps, or date objects cleanly
 * @param {string|number|Date} dateVal
 * @returns {string}
 */
export function formatDate(dateVal) {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    
    // Format date part: "Sep 3, 2026"
    const datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Format time part: "8:42 PM"
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `${datePart} • ${timePart}`;
  } catch (err) {
    return String(dateVal);
  }
}

/**
 * Format relative time (e.g. "5m ago", "2h ago", "Just now")
 * @param {string|number|Date} dateVal
 * @returns {string}
 */
export function formatRelativeTime(dateVal) {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return '-';
  }
}
