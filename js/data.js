/**
 * Data Processing Module for Battlefield 6 TTK Analysis
 * Handles CSV loading, parsing, and data transformation
 */

// Global data store
let weaponsData = [];
let filteredData = [];

/**
 * Load and parse CSV data
 * @returns {Promise<Array>} Promise that resolves with weapons data
 */
async function loadWeaponData() {
    try {
        const response = await fetch('data/ttk.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false, // We'll handle type conversion manually
                complete: function(results) {
                    if (results.errors.length > 0) {
                        console.warn('CSV parsing warnings:', results.errors);
                    }

                    // Process and clean the data
                    const processedData = processWeaponData(results.data);
                    weaponsData = processedData;
                    filteredData = processedData;

                    console.log(`Loaded ${weaponsData.length} weapons`);
                    resolve(processedData);
                },
                error: function(error) {
                    console.error('CSV parsing error:', error);
                    reject(error);
                }
            });
        });
    } catch (error) {
        console.error('Error loading weapon data:', error);
        throw error;
    }
}

/**
 * Process and clean raw CSV data
 * @param {Array} rawData - Raw data from Papa Parse
 * @returns {Array} Processed weapon objects
 */
function processWeaponData(rawData) {
    return rawData
        .map(row => {
            // Clean and standardize the data
            const weapon = {
                'Weapon Type': (row['Weapon Type'] || '').trim(),
                'Weapon': (row['Weapon'] || '').trim(),
                '10M': parseNumeric(row['10M']),
                '20M': parseNumeric(row['20M']),
                '35M': parseNumeric(row['35M']),
                '50M': parseNumeric(row['50M']),
                '70M': parseNumeric(row['70M']),
                'RPM': parseNumeric(row['RPM']),
                'DPS': parseNumeric(row['DPS']),
                'ADS': parseNumeric(row['ADS'])
            };

            // Calculate TTK for each range
            RANGES.forEach(range => {
                const damage = weapon[range];
                const rpm = weapon.RPM;
                weapon[`TTK_${range}`] = calculateTTK(damage, rpm);
            });

            // Calculate shots to kill for each range
            RANGES.forEach(range => {
                const damage = weapon[range];
                weapon[`STK_${range}`] = calculateShotsToKill(damage);
            });

            // Add metadata
            weapon.isComplete = isWeaponDataComplete(weapon);
            weapon.averageDamage = getAverageDamage(weapon);

            return weapon;
        })
        .filter(weapon => weapon.Weapon && weapon['Weapon Type']); // Remove empty rows
}

/**
 * Parse numeric value, handling empty strings and invalid numbers
 * @param {string|number} value - Value to parse
 * @returns {number|null} Parsed number or null if invalid
 */
function parseNumeric(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
}

/**
 * Get all unique weapon types
 * @returns {Array<string>} Array of weapon type names
 */
function getWeaponTypes() {
    const types = [...new Set(weaponsData.map(w => w['Weapon Type']))];
    return types.filter(t => t).sort();
}

/**
 * Get weapons by type
 * @param {string|Array<string>} types - Weapon type(s) to filter
 * @returns {Array} Filtered weapons
 */
function getWeaponsByType(types) {
    if (!types || types === 'ALL' || (Array.isArray(types) && types.includes('ALL'))) {
        return weaponsData;
    }

    const typeArray = Array.isArray(types) ? types : [types];
    return weaponsData.filter(w => typeArray.includes(w['Weapon Type']));
}

/**
 * Get weapon by exact name
 * @param {string} name - Weapon name
 * @returns {Object|null} Weapon object or null if not found
 */
function getWeaponByName(name) {
    return weaponsData.find(w => w.Weapon === name) || null;
}

/**
 * Get top N weapons by metric at specific range
 * @param {number} n - Number of weapons to return
 * @param {string} metric - Metric to sort by ('ttk', 'damage', 'dps', 'rpm')
 * @param {string} range - Range for damage/ttk metrics
 * @returns {Array} Top N weapons
 */
function getTopWeapons(n = 5, metric = 'ttk', range = '10M') {
    const validWeapons = weaponsData.filter(w => {
        if (metric === 'dps') return w.DPS !== null;
        if (metric === 'rpm') return w.RPM !== null;
        return w[range] !== null && w.RPM !== null;
    });

    const sorted = sortWeapons(validWeapons, metric, range);
    return sorted.slice(0, n);
}

/**
 * Get weapons with complete data only
 * @returns {Array} Weapons with all fields populated
 */
function getCompleteWeapons() {
    return weaponsData.filter(isWeaponDataComplete);
}

/**
 * Get weapons with incomplete data
 * @returns {Array} Weapons missing some data
 */
function getIncompleteWeapons() {
    return weaponsData.filter(w => !isWeaponDataComplete(w));
}

/**
 * Get damage values for a specific weapon across all ranges
 * @param {Object} weapon - Weapon object
 * @returns {Object} Object with ranges as keys and damage as values
 */
function getWeaponDamageProfile(weapon) {
    const profile = {};
    RANGES.forEach(range => {
        profile[range] = weapon[range];
    });
    return profile;
}

/**
 * Get TTK values for a specific weapon across all ranges
 * @param {Object} weapon - Weapon object
 * @returns {Object} Object with ranges as keys and TTK as values
 */
function getWeaponTTKProfile(weapon) {
    const profile = {};
    RANGES.forEach(range => {
        profile[range] = weapon[`TTK_${range}`];
    });
    return profile;
}

/**
 * Compare two weapons across all metrics
 * @param {string} weapon1Name - First weapon name
 * @param {string} weapon2Name - Second weapon name
 * @returns {Object} Comparison object
 */
function compareWeapons(weapon1Name, weapon2Name) {
    const w1 = getWeaponByName(weapon1Name);
    const w2 = getWeaponByName(weapon2Name);

    if (!w1 || !w2) {
        return null;
    }

    const comparison = {
        weapons: [w1.Weapon, w2.Weapon],
        types: [w1['Weapon Type'], w2['Weapon Type']],
        rpm: [w1.RPM, w2.RPM],
        dps: [w1.DPS, w2.DPS],
        ranges: {}
    };

    RANGES.forEach(range => {
        comparison.ranges[range] = {
            damage: [w1[range], w2[range]],
            ttk: [w1[`TTK_${range}`], w2[`TTK_${range}`]],
            stk: [w1[`STK_${range}`], w2[`STK_${range}`]]
        };
    });

    return comparison;
}

/**
 * Get weapons suitable for a specific range
 * @param {string} range - Target range (e.g., '10M')
 * @param {number} limit - Maximum number of results
 * @returns {Array} Best weapons for that range, sorted by TTK
 */
function getWeaponsForRange(range, limit = 10) {
    const validWeapons = weaponsData.filter(w =>
        w[range] !== null && w.RPM !== null
    );

    return sortWeapons(validWeapons, 'ttk', range).slice(0, limit);
}

/**
 * Get statistical summary for a weapon type
 * @param {string} weaponType - Type of weapon
 * @returns {Object} Statistical summary
 */
function getWeaponTypeStats(weaponType) {
    const weapons = getWeaponsByType(weaponType);

    if (weapons.length === 0) {
        return null;
    }

    const stats = {
        count: weapons.length,
        complete: weapons.filter(isWeaponDataComplete).length,
        rpm: {
            min: Math.min(...weapons.map(w => w.RPM).filter(r => r !== null)),
            max: Math.max(...weapons.map(w => w.RPM).filter(r => r !== null)),
            avg: weapons.reduce((sum, w) => sum + (w.RPM || 0), 0) / weapons.filter(w => w.RPM).length
        },
        ranges: {}
    };

    RANGES.forEach(range => {
        const damages = weapons.map(w => w[range]).filter(d => d !== null);
        if (damages.length > 0) {
            stats.ranges[range] = {
                minDamage: Math.min(...damages),
                maxDamage: Math.max(...damages),
                avgDamage: damages.reduce((sum, d) => sum + d, 0) / damages.length
            };
        }
    });

    return stats;
}

/**
 * Apply filters to weapon data
 * @param {Object} filters - Filter object
 * @returns {Array} Filtered weapons
 */
function applyFilters(filters = {}) {
    let data = weaponsData;

    // Filter by weapon type
    if (filters.types && filters.types.length > 0 && !filters.types.includes('ALL')) {
        data = filterWeaponsByType(data, filters.types);
    }

    // Filter by search term
    if (filters.search) {
        data = searchWeapons(data, filters.search);
    }

    // Filter by data completeness
    if (filters.completeOnly) {
        data = data.filter(isWeaponDataComplete);
    }

    // Filter by RPM range
    if (filters.minRPM || filters.maxRPM) {
        data = data.filter(w => {
            const rpm = w.RPM;
            if (rpm === null) return false;
            if (filters.minRPM && rpm < filters.minRPM) return false;
            if (filters.maxRPM && rpm > filters.maxRPM) return false;
            return true;
        });
    }

    filteredData = data;
    return data;
}

/**
 * Reset filters to show all data
 * @returns {Array} All weapons
 */
function resetFilters() {
    filteredData = weaponsData;
    return weaponsData;
}

/**
 * Get current filtered data
 * @returns {Array} Currently filtered weapons
 */
function getFilteredData() {
    return filteredData;
}

/**
 * Get all weapons data
 * @returns {Array} All weapons
 */
function getAllWeapons() {
    return weaponsData;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadWeaponData,
        getWeaponTypes,
        getWeaponsByType,
        getWeaponByName,
        getTopWeapons,
        getCompleteWeapons,
        getIncompleteWeapons,
        getWeaponDamageProfile,
        getWeaponTTKProfile,
        compareWeapons,
        getWeaponsForRange,
        getWeaponTypeStats,
        applyFilters,
        resetFilters,
        getFilteredData,
        getAllWeapons
    };
}
