/**
 * Main Application Logic for Battlefield 6 TTK Visualization
 * Handles initialization, event listeners, and UI updates
 */

// Application state
let currentFilters = {
    types: ['ALL'],
    range: 'all',
    chartType: 'damage',
    search: '',
    includeADS: false
};

let isDarkTheme = true; // Default to dark theme

/**
 * Show loading state
 */
function showLoadingState() {
    const mainChart = document.getElementById('mainChart');
    if (mainChart) {
        mainChart.innerHTML = '<div class="loading-indicator">🎯 Loading weapon data...</div>';
    }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    // Loading state will be replaced by actual charts
}

/**
 * Show error message
 */
function showError(message) {
    const mainChart = document.getElementById('mainChart');
    if (mainChart) {
        mainChart.innerHTML = `<div class="error-message">❌ Error: ${message}</div>`;
    }
    console.error('Application Error:', message);
}

/**
 * Initialize charts with default data
 */
function initializeCharts(weapons) {
    const completeWeapons = weapons.filter(isWeaponDataComplete);
    if (completeWeapons.length > 0) {
        createDamageChart(completeWeapons, 'mainChart');
        createTTKChart(completeWeapons, '10M', 'ttkChart');
        createRPMvsDPSChart(completeWeapons, 'dpsChart');
    }
}

/**
 * Get all weapons data
 */
function getAllWeapons() {
    return weaponsData || [];
}

/**
 * Get filtered weapon data
 */
function getFilteredData() {
    return applyFilters(currentFilters);
}

/**
 * Apply current filters to weapon data
 */
function applyFilters(filters) {
    let filtered = weaponsData || [];
    
    // Apply type filter
    if (filters.types && !filters.types.includes('ALL')) {
        filtered = filtered.filter(w => filters.types.includes(w['Weapon Type']));
    }
    
    // Apply search filter
    if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(w => 
            w.Weapon.toLowerCase().includes(searchTerm) ||
            w['Weapon Type'].toLowerCase().includes(searchTerm)
        );
    }
    
    return filtered;
}

/**
 * Reset all filters to default state
 */
function resetFilters() {
    // This function is called by handleResetFilters - keeping for compatibility
}

/**
 * Update chart based on type and data
 */
function updateChart(chartType, weapons, options) {
    const containerId = options.containerId || 'mainChart';
    const range = options.range || '10M';
    
    switch(chartType) {
        case 'damage':
            createDamageChart(weapons, containerId);
            break;
        case 'ttk':
            createTTKChart(weapons, range, containerId);
            break;
        case 'rpm-dps':
            createRPMvsDPSChart(weapons, containerId);
            break;
        default:
            createDamageChart(weapons, containerId);
    }
}

/**
 * Clear chart container
 */
function clearChart(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Initialize the application
 */
async function init() {
    try {
        showLoadingState();

        // Load weapon data
        const weapons = await loadWeaponData();

        // Initialize UI
        updateStatsSummary(weapons);
        populateWeaponTable(weapons);
        initializeCharts(weapons);

        // Setup event listeners
        setupEventListeners();

        // Ensure UI matches default filter state
        applyDefaultFilterState();

        // Apply saved theme preference
        loadThemePreference();

        hideLoadingState();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Failed to load weapon data. Please refresh the page.');
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Weapon type filter
    const typeFilter = document.getElementById('weaponTypeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', handleFilterChange);
    }

    // Range selector
    const rangeSelector = document.getElementById('rangeSelector');
    if (rangeSelector) {
        rangeSelector.addEventListener('change', handleRangeChange);
    }

    // Chart type selector
    const chartType = document.getElementById('chartType');
    if (chartType) {
        chartType.addEventListener('change', handleChartTypeChange);
    }

    // Reset filters button
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetFilters);
    }

    // Compare all button
    const compareBtn = document.getElementById('compareAll');
    if (compareBtn) {
        compareBtn.addEventListener('click', handleCompareAll);
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Table search
    const tableSearch = document.getElementById('tableSearch');
    if (tableSearch) {
        tableSearch.addEventListener('input', debounce(handleTableSearch, 300));
    }

    // Export CSV button
    const exportBtn = document.getElementById('exportCSV');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportCSV);
    }

    // Fire mode selector
    const fireMode = document.getElementById('fireMode');
    if (fireMode) {
        fireMode.addEventListener('change', handleFireModeChange);
    }
}

/**
 * Handle weapon type filter change
 */
function handleFilterChange(event) {
    const selectedOptions = Array.from(event.target.selectedOptions);
    const selectedTypes = selectedOptions.map(opt => opt.value);

    // If "All Weapons" is selected with specific types, deselect "All"
    if (selectedTypes.includes('ALL') && selectedTypes.length > 1) {
        // Remove "All" selection, keep specific types
        const specificTypes = selectedTypes.filter(type => type !== 'ALL');
        currentFilters.types = specificTypes;
        
        // Update UI to reflect the change
        Array.from(event.target.options).forEach(option => {
            if (option.value === 'ALL') {
                option.selected = false;
            }
        });
    } else if (selectedTypes.length === 0) {
        // If nothing selected, default to "All"
        currentFilters.types = ['ALL'];
        event.target.querySelector('option[value="ALL"]').selected = true;
    } else {
        currentFilters.types = selectedTypes;
    }

    updateVisualization();
}

/**
 * Handle range selector change
 */
function handleRangeChange(event) {
    currentFilters.range = event.target.value;
    updateVisualization();
}

/**
 * Handle chart type change
 */
function handleChartTypeChange(event) {
    currentFilters.chartType = event.target.value;
    updateVisualization();
}

/**
 * Handle reset filters button click
 */
function handleResetFilters() {
    // Reset filter state
    currentFilters = {
        types: ['ALL'],
        range: 'all',
        chartType: 'damage',
        search: '',
        includeADS: false
    };

    // Reset UI controls
    const typeFilter = document.getElementById('weaponTypeFilter');
    if (typeFilter) {
        // Clear all selections first
        Array.from(typeFilter.options).forEach(option => {
            option.selected = option.value === 'ALL';
        });
    }

    const rangeSelector = document.getElementById('rangeSelector');
    if (rangeSelector) {
        rangeSelector.value = 'all';
    }

    const chartType = document.getElementById('chartType');
    if (chartType) {
        chartType.value = 'damage';
    }

    const tableSearch = document.getElementById('tableSearch');
    if (tableSearch) {
        tableSearch.value = '';
    }

    const fireMode = document.getElementById('fireMode');
    if (fireMode) {
        fireMode.value = 'hip';
    }

    // Update visualization
    resetFilters();
    updateVisualization();
    populateWeaponTable(getAllWeapons());
}

/**
 * Apply default filter state to UI elements (matches Reset Filters)
 */
function applyDefaultFilterState() {
    // Ensure UI controls match the default currentFilters state
    const typeFilter = document.getElementById('weaponTypeFilter');
    if (typeFilter) {
        Array.from(typeFilter.options).forEach(option => {
            option.selected = option.value === 'ALL';
        });
    }

    const rangeSelector = document.getElementById('rangeSelector');
    if (rangeSelector) {
        rangeSelector.value = 'all';
    }

    const chartType = document.getElementById('chartType');
    if (chartType) {
        chartType.value = 'damage';
    }

    const fireMode = document.getElementById('fireMode');
    if (fireMode) {
        fireMode.value = 'hip';
    }

    const tableSearch = document.getElementById('tableSearch');
    if (tableSearch) {
        tableSearch.value = '';
    }
}

/**
 * Handle compare all button click
 */
function handleCompareAll() {
    const weapons = getCompleteWeapons();
    if (weapons.length === 0) {
        alert('No weapons with complete data available for comparison.');
        return;
    }

    clearChart('mainChart');
    createDamageChart(weapons, 'mainChart');
}

/**
 * Handle table search input
 */
function handleTableSearch(event) {
    currentFilters.search = event.target.value;
    const weapons = applyFilters(currentFilters);
    populateWeaponTable(weapons);
}

/**
 * Handle fire mode change (Hip Fire vs ADS)
 */
function handleFireModeChange(event) {
    currentFilters.includeADS = event.target.value === 'ads';
    updateVisualization();
    populateWeaponTable(applyFilters(currentFilters));
}

/**
 * Handle CSV export
 */
function handleExportCSV() {
    const weapons = getFilteredData();
    if (weapons.length === 0) {
        alert('No data to export.');
        return;
    }

    const csv = exportToCSV(weapons);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `battlefield6_ttk_${timestamp}.csv`);
}

/**
 * Update visualization based on current filters
 */
function updateVisualization() {
    const weapons = applyFilters(currentFilters);

    // Show more weapons for damage chart, limit others
    let displayWeapons = weapons.filter(isWeaponDataComplete);
    
    if (currentFilters.types.includes('ALL')) {
        // For damage chart, show all complete weapons; for others, limit to avoid clutter
        if (currentFilters.chartType === 'damage') {
            displayWeapons = displayWeapons; // Show all complete weapons
        } else {
            displayWeapons = displayWeapons.slice(0, 20); // Limit other charts
        }
    }

    const options = {
        containerId: 'mainChart',
        range: currentFilters.range === 'all' ? '10M' : currentFilters.range
    };

    updateChart(currentFilters.chartType, displayWeapons, options);

    // Update secondary charts
    if (currentFilters.range !== 'all') {
        createTTKChart(weapons, currentFilters.range, 'ttkChart');
    } else {
        createTTKChart(weapons, '10M', 'ttkChart');
    }

    // Update table
    populateWeaponTable(weapons);

    // Update stats
    updateStatsSummary(weapons);
}

/**
 * Update statistics summary cards
 */
function updateStatsSummary(weapons) {
    const stats = getWeaponStatistics(weapons);

    const totalElement = document.getElementById('totalWeapons');
    if (totalElement) {
        totalElement.textContent = stats.total;
    }

    const completeElement = document.getElementById('completeWeapons');
    if (completeElement) {
        completeElement.textContent = `${stats.complete}/${stats.total}`;
    }

    const typesElement = document.getElementById('weaponTypes');
    if (typesElement) {
        typesElement.textContent = stats.types;
    }

    const coverageElement = document.getElementById('dataCoverage');
    if (coverageElement) {
        coverageElement.textContent = stats.coverage;
    }
}

/**
 * Populate weapon statistics table
 */
function populateWeaponTable(weapons) {
    const tbody = document.getElementById('weaponTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    weapons.forEach(weapon => {
        const row = document.createElement('tr');

        // Add class for incomplete data
        if (!weapon.isComplete) {
            row.classList.add('incomplete-data');
        }

        // Calculate TTK with current ADS mode
        const adsTime = currentFilters.includeADS ? weapon.ADS : 0;
        const ttk10M = weapon['10M'] && weapon.RPM
            ? `${calculateTTK(weapon['10M'], weapon.RPM, adsTime)}ms`
            : 'N/A';
        const status = weapon.isComplete
            ? '<span class="status-badge complete">Complete</span>'
            : '<span class="status-badge incomplete">Incomplete</span>';

        row.innerHTML = `
            <td>${weapon['Weapon Type']}</td>
            <td><strong>${weapon.Weapon}</strong></td>
            <td>${formatNumber(weapon['10M'])}</td>
            <td>${formatNumber(weapon['20M'])}</td>
            <td>${formatNumber(weapon['35M'])}</td>
            <td>${formatNumber(weapon['50M'])}</td>
            <td>${formatNumber(weapon['70M'])}</td>
            <td>${formatNumber(weapon.RPM)}</td>
            <td>${formatNumber(weapon.DPS)}</td>
            <td>${formatNumber(weapon.ADS)}</td>
            <td>${ttk10M}</td>
            <td>${status}</td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Toggle between dark and light theme
 */
function toggleTheme() {
    isDarkTheme = !isDarkTheme;

    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');

    if (isDarkTheme) {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        if (themeIcon) themeIcon.textContent = '🌙';
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        if (themeIcon) themeIcon.textContent = '☀️';
    }

    // Save preference
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');

    // Update chart themes
    applyChartTheme(isDarkTheme);

    // Refresh charts with new theme
    updateVisualization();
}

/**
 * Load saved theme preference
 */
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        isDarkTheme = savedTheme === 'dark';
    }

    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');

    if (isDarkTheme) {
        body.classList.add('dark-theme');
        if (themeIcon) themeIcon.textContent = '🌙';
    } else {
        body.classList.add('light-theme');
        if (themeIcon) themeIcon.textContent = '☀️';
    }

    applyChartTheme(isDarkTheme);
}

/**
 * Show loading state
 */
function showLoadingState() {
    const main = document.querySelector('main');
    if (main) {
        main.style.opacity = '0.5';
        main.style.pointerEvents = 'none';
    }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const main = document.querySelector('main');
    if (main) {
        main.style.opacity = '1';
        main.style.pointerEvents = 'auto';
    }
}

/**
 * Show error message to user
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
    }

    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging purposes
if (typeof window !== 'undefined') {
    window.app = {
        currentFilters,
        updateVisualization,
        getAllWeapons,
        getFilteredData,
        getWeaponByName,
        compareWeapons
    };
}
