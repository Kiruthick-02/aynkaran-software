/**
 * Formatting utilities for Aynkaran Consultants ERP
 */

/**
 * Format a number as Indian Rupee (INR) currency
 * @param {number|string} amount 
 * @returns {string} Formatted currency string, e.g., ₹12,00,000
 */
export function formatINR(amount) {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(numericAmount);
}

/**
 * Format a ISO timestamp or date string into a standard, readable date representation
 * @param {string} dateStr 
 * @returns {string} Formatted date, e.g., May 24, 2026
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateStr;
  }
}

/**
 * Capitalize first letter of each word
 * @param {string} str 
 * @returns {string}
 */
export function titleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
