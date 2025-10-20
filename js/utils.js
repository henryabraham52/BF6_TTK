/**
 * Utility Functions for Battlefield 6 TTK Analysis
 * Provides helper functions for calculations and data processing
 */

// Constants
const PLAYER_HEALTH = 100;
const RANGES = ['10M', '20M', '35M', '50M', '70M'];

/**
 * Get accuracy multiplier by range (to reduce hit chance at distance)
 * @param {string} range - e.g., '10M'
 * @returns {number} multiplier in [0,1]
 */
function getRangeAccuracyMultiplier(range) {
    const map = {
        '10M': 1.0,
        '20M': 0.95,
        '35M': 0.9,
        '50M': 0.85,
        '70M': 0.8
    };
    return map[range] != null ? map[range] : 1.0;
}

/**
 * Calculate Time-to-Kill in milliseconds
 * @param {number} damage - Damage per shot
 * @param {number} rpm - Rounds per minute
 * @param {number} adsTime - ADS time in milliseconds (optional)
 * @returns {number} TTK in milliseconds
 */
function calculateTTK(damage, rpm, adsTime = 0) {
    if (!damage || !rpm || damage <= 0 || rpm <= 0) {
        return null;
    }

    const shotsToKill = Math.ceil(PLAYER_HEALTH / damage);
    const timeBetweenShots = 60000 / rpm; // Convert RPM to milliseconds
    const ttk = (shotsToKill - 1) * timeBetweenShots + (adsTime || 0);

    // Prevent 0ms TTK for instant kills - use 1ms minimum for sorting
    const finalTTK = Math.round(ttk * 10) / 10;
    return finalTTK === 0 ? 1 : finalTTK;
}

/**
 * Calculate recoil-adjusted TTK using weapon precision/control and range degradation.
 * ADS time is ignored for this method.
 * @param {number} damage
 * @param {number} rpm
 * @param {number} precision - 0..100
 * @param {number} control - 0..100
 * @param {string} range - one of RANGES
 * @returns {number|null}
 */
function calculateRecoilAdjustedTTK(damage, rpm, precision = 100, control = 100, range = '10M', weaponType = '') {
    if (!damage || !rpm || damage <= 0 || rpm <= 0) {
        return null;
    }

    const requiredHits = Math.ceil(PLAYER_HEALTH / damage);

    // Snipers and shotguns are immune (assume all shots land)
    const type = (weaponType || '').toUpperCase();
    if (type === 'SNIPER RIFLE' || type === 'SHOTGUN') {
        const timeBetweenShotsImmune = 60000 / rpm;
        const ttkImmune = (requiredHits - 1) * timeBetweenShotsImmune; // no ADS
        const finalImmune = Math.round(ttkImmune * 10) / 10;
        return finalImmune === 0 ? 1 : finalImmune;
    }

    let hitPct = (Number(precision) / 100) * (Number(control) / 100); // base probability 0..1
    const rangeMult = getRangeAccuracyMultiplier(range);
    hitPct = hitPct * rangeMult;

    // Minimal penalty at 10m: floor at 0.9
    if (range === '10M') {
        hitPct = Math.max(hitPct, 0.9);
    }

    // Clamp probability to reasonable bounds
    const p = Math.min(1, Math.max(0.05, hitPct));

    const expectedShots = Math.ceil(requiredHits / p);
    const timeBetweenShots = 60000 / rpm;
    const ttk = (expectedShots - 1) * timeBetweenShots; // no ADS
    const finalTTK = Math.round(ttk * 10) / 10;
    return finalTTK === 0 ? 1 : finalTTK;
}

/**
 * Calculate shots required to kill
 * @param {number} damage - Damage per shot
 * @returns {number} Number of shots needed
 */
function calculateShotsToKill(damage) {
    if (!damage || damage <= 0) {
        return null;
    }
    return Math.ceil(PLAYER_HEALTH / damage);
}

/**
 * Validate if weapon data is complete
 * @param {Object} weapon - Weapon data object
 * @returns {boolean} True if all required fields are present
 */
function isWeaponDataComplete(weapon) {
    const requiredFields = ['Weapon', 'Weapon Type', 'RPM', 'ADS', ...RANGES];
    return requiredFields.every(field => {
        const value = weapon[field];
        // Consider 0 as valid data (e.g., shotguns with 0 damage at long range)
        if (field === 'Weapon' || field === 'Weapon Type') {
            return value !== null && value !== undefined && value !== '';
        }
        // For numeric fields, allow 0 but not null/undefined/empty string
        return value !== null && value !== undefined && value !== '' && !isNaN(parseFloat(value));
    });
}

/**
 * Get weapon type color for consistent visualization
 * @param {string} weaponType - Type of weapon
 * @returns {string} Hex color code
 */
function getWeaponTypeColor(weaponType) {
    const colorMap = {
        'ASSAULT RIFLE': '#FF6B35', // Orange-red
        'CARBINE': '#F7931E',       // Orange
        'SMG': '#FFC857',           // Yellow
        'LMG': '#4ECDC4',           // Teal
        'DMR': '#95E1D3',           // Light teal
        'SNIPER RIFLE': '#8B4A6B',  // Purple
        'SHOTGUN': '#E74C3C',       // Red
        'PISTOL': '#9B59B6'         // Violet
    };
    return colorMap[weaponType] || '#CCCCCC';
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
    if (num === null || num === undefined || num === '') {
        return 'N/A';
    }
    return num.toLocaleString();
}

/**
 * Get best weapon at specific range based on TTK
 * @param {Array} weapons - Array of weapon objects
 * @param {string} range - Range to evaluate (e.g., '10M')
 * @returns {Object} Best weapon object
 */
function getBestWeaponAtRange(weapons, range) {
    const validWeapons = weapons.filter(w => {
        const damage = parseFloat(w[range]);
        const rpm = parseFloat(w.RPM);
        return damage && rpm;
    });

    if (validWeapons.length === 0) return null;

    return validWeapons.reduce((best, current) => {
        const bestTTK = calculateTTK(parseFloat(best[range]), parseFloat(best.RPM));
        const currentTTK = calculateTTK(parseFloat(current[range]), parseFloat(current.RPM));
        return currentTTK < bestTTK ? current : best;
    });
}

/**
 * Calculate average damage across all ranges for a weapon
 * @param {Object} weapon - Weapon data object
 * @returns {number} Average damage
 */
function getAverageDamage(weapon) {
    const damages = RANGES.map(range => parseFloat(weapon[range])).filter(d => !isNaN(d));
    if (damages.length === 0) return null;
    return damages.reduce((sum, d) => sum + d, 0) / damages.length;
}

/**
 * Get damage drop-off percentage between two ranges
 * @param {Object} weapon - Weapon data object
 * @param {string} rangeStart - Starting range
 * @param {string} rangeEnd - Ending range
 * @returns {number} Drop-off percentage
 */
function getDamageDropoff(weapon, rangeStart, rangeEnd) {
    const startDamage = parseFloat(weapon[rangeStart]);
    const endDamage = parseFloat(weapon[rangeEnd]);

    if (!startDamage || !endDamage) return null;

    const dropoff = ((startDamage - endDamage) / startDamage) * 100;
    return Math.round(dropoff * 10) / 10;
}

/**
 * Sort weapons by a specific metric
 * @param {Array} weapons - Array of weapon objects
 * @param {string} sortBy - Metric to sort by ('ttk', 'damage', 'rpm', 'dps')
 * @param {string} range - Range for damage/ttk sorting
 * @returns {Array} Sorted weapons array
 */
function sortWeapons(weapons, sortBy = 'ttk', range = '10M') {
    return [...weapons].sort((a, b) => {
        let aValue, bValue;

        switch(sortBy) {
            case 'ttk':
                aValue = calculateTTK(parseFloat(a[range]), parseFloat(a.RPM));
                bValue = calculateTTK(parseFloat(b[range]), parseFloat(b.RPM));
                // Lower TTK is better, so reverse sort
                return (aValue || Infinity) - (bValue || Infinity);

            case 'damage':
                aValue = parseFloat(a[range]);
                bValue = parseFloat(b[range]);
                return (bValue || 0) - (aValue || 0);

            case 'rpm':
                aValue = parseFloat(a.RPM);
                bValue = parseFloat(b.RPM);
                return (bValue || 0) - (aValue || 0);

            case 'dps':
                aValue = parseFloat(a.DPS);
                bValue = parseFloat(b.DPS);
                return (bValue || 0) - (aValue || 0);

            default:
                return 0;
        }
    });
}

/**
 * Filter weapons by type
 * @param {Array} weapons - Array of weapon objects
 * @param {Array} types - Array of weapon types to include
 * @returns {Array} Filtered weapons array
 */
function filterWeaponsByType(weapons, types) {
    if (!types || types.length === 0 || types.includes('ALL')) {
        return weapons;
    }
    return weapons.filter(w => types.includes(w['Weapon Type']));
}

/**
 * Search weapons by name
 * @param {Array} weapons - Array of weapon objects
 * @param {string} searchTerm - Search term
 * @returns {Array} Matching weapons
 */
function searchWeapons(weapons, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        return weapons;
    }

    const term = searchTerm.toLowerCase();
    return weapons.filter(w =>
        w.Weapon.toLowerCase().includes(term) ||
        w['Weapon Type'].toLowerCase().includes(term)
    );
}

/**
 * Export data to CSV format
 * @param {Array} weapons - Array of weapon objects
 * @returns {string} CSV formatted string
 */
function exportToCSV(weapons) {
    if (weapons.length === 0) return '';

    const headers = Object.keys(weapons[0]);
    const csvRows = [headers.join(',')];

    weapons.forEach(weapon => {
        const values = headers.map(header => {
            const value = weapon[header];
            // Escape values containing commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
}

/**
 * Download data as CSV file
 * @param {string} csvContent - CSV formatted string
 * @param {string} filename - Desired filename
 */
function downloadCSV(csvContent, filename = 'battlefield6_ttk_data.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Get statistics summary for all weapons
 * @param {Array} weapons - Array of weapon objects
 * @returns {Object} Statistics object
 */
function getWeaponStatistics(weapons) {
    const total = weapons.length;
    const complete = weapons.filter(isWeaponDataComplete).length;
    const types = [...new Set(weapons.map(w => w['Weapon Type']))];
    const coverage = total > 0 ? Math.round((complete / total) * 100) : 0;

    return {
        total,
        complete,
        incomplete: total - complete,
        types: types.length,
        typesList: types,
        coverage: `${coverage}%`
    };
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PLAYER_HEALTH,
        RANGES,
        calculateTTK,
        calculateShotsToKill,
        isWeaponDataComplete,
        getWeaponTypeColor,
        formatNumber,
        getBestWeaponAtRange,
        getAverageDamage,
        getDamageDropoff,
        sortWeapons,
        filterWeaponsByType,
        searchWeapons,
        exportToCSV,
        downloadCSV,
        getWeaponStatistics,
        debounce,
        getRangeAccuracyMultiplier,
        calculateRecoilAdjustedTTK
    };
}
