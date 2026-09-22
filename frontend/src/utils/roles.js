/**
 * Role Normalization & Route Authorization Utilities
 */

/**
 * Normalizes any role representation into a clean lowercase string.
 * Handles strings, objects with name/role property, or undefined values.
 *
 * @param {string|object} role
 * @returns {string} Normalized role string (e.g. 'citizen', 'university', 'admin')
 */
export function normalizeRole(role) {
  if (!role) return '';
  if (typeof role === 'object') {
    if (role.name) return String(role.name).toLowerCase().trim();
    if (role.role) return String(role.role).toLowerCase().trim();
  }
  return String(role).toLowerCase().trim();
}

/**
 * Checks if a user role satisfies an allowedRoles list (case-insensitively).
 *
 * @param {string|object} userRole
 * @param {string[]} allowedRoles
 * @returns {boolean}
 */
export function isRoleAllowed(userRole, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const normalizedUserRole = normalizeRole(userRole);
  if (!normalizedUserRole) return false;
  return allowedRoles.map(normalizeRole).includes(normalizedUserRole);
}

/**
 * Returns default dashboard route for a given role.
 *
 * @param {string|object} role
 * @returns {string}
 */
export function getDefaultDashboard(role) {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'citizen':
      return '/dashboard/citizen';
    case 'university':
      return '/dashboard/university';
    case 'industry':
      return '/dashboard/industry';
    case 'government':
      return '/dashboard/government';
    case 'admin':
      return '/dashboard/admin';
    default:
      return '/dashboard';
  }
}

/**
 * Returns a safe redirect target after login.
 * Rejects stale, unauthorized, or cross-role paths.
 *
 * @param {string} fromPath
 * @param {string|object} userRole
 * @returns {string} Safe route to navigate to
 */
export function getSafeRedirect(fromPath, userRole) {
  const normRole = normalizeRole(userRole);
  const fallback = getDefaultDashboard(normRole);

  if (!fromPath || typeof fromPath !== 'string') return fallback;
  const path = fromPath.trim();

  // Exclude error pages, landing, and auth forms
  if (
    path === '' ||
    path === '/' ||
    path === '/login' ||
    path === '/register' ||
    path.startsWith('/unauthorized')
  ) {
    return fallback;
  }

  // Disallow entering other roles' admin or dashboard pages
  if (path.startsWith('/admin') && normRole !== 'admin' && normRole !== 'government') {
    return fallback;
  }
  if (path.startsWith('/dashboard/') && path !== `/dashboard/${normRole}`) {
    return fallback;
  }
  if (path.startsWith('/citizen/challenges/new') && normRole !== 'citizen') {
    return fallback;
  }

  return path;
}

