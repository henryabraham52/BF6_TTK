/**
 * Chart Generation Module for Battlefield 6 TTK Analysis
 * Uses Plotly.js to create interactive visualizations
 */

// Chart configuration defaults
const CHART_CONFIG = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false
};

const CHART_LAYOUT_DEFAULTS = {
    font: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        size: 12
    },
    hovermode: 'closest',
    plot_bgcolor: '#1a1a1a',
    paper_bgcolor: '#121212',
    margin: { t: 40, r: 20, b: 60, l: 60 }
};

/**
 * Create damage vs range line chart
 * @param {Array} weapons - Array of weapon objects
 * @param {string} containerId - DOM element ID for chart
 */
function createDamageChart(weapons, containerId = 'mainChart') {
    // Group weapons by type for better color organization
    const weaponTypes = [...new Set(weapons.map(w => w['Weapon Type']))];
    const colorPalette = {
        'ASSAULT RIFLE': ['#FF6B35', '#FF8C42', '#FFAD5A', '#FFC65C'],
        'CARBINE': ['#F7931E', '#FFB347', '#FFA500', '#FF8C00'],
        'SMG': ['#FFC857', '#FFD700', '#FFED4A', '#FFEB3B'],
        'LMG': ['#4ECDC4', '#26A69A', '#00ACC1', '#0097A7'],
        'DMR': ['#95E1D3', '#4DB6AC', '#26A69A', '#00897B'],
        'SNIPER RIFLE': ['#8B4A6B', '#AD6BAD', '#C47AC0', '#D8A2D8'],
        'SHOTGUN': ['#E74C3C', '#EC7063', '#F1948A', '#F5B7B1'],
        'PISTOL': ['#9B59B6', '#BB8FCE', '#D2B4DE', '#E8DAEF']
    };
    
    const traces = weapons.map((weapon, index) => {
        const weaponTypeIndex = weaponTypes.indexOf(weapon['Weapon Type']);
        const typeColors = colorPalette[weapon['Weapon Type']] || ['#CCCCCC'];
        const colorIndex = weapons.filter(w => w['Weapon Type'] === weapon['Weapon Type']).indexOf(weapon);
        const lineColor = typeColors[colorIndex % typeColors.length];
        
        const damages = RANGES.map(range => weapon[range]);
        const rangeLabels = RANGES.map(r => r.replace('M', 'm'));

        return {
            x: rangeLabels,
            y: damages,
            type: 'scatter',
            mode: 'lines+markers',
            name: `${weapon.Weapon} (${weapon['Weapon Type']})`,
            line: {
                color: lineColor,
                width: 3,
                dash: weapon['Weapon Type'] === 'SNIPER RIFLE' ? 'dash' : 'solid'
            },
            marker: {
                size: 6,
                color: lineColor,
                line: { width: 1, color: '#000' }
            },
            opacity: 0.8,
            hovertemplate:
                `<b>%{fullData.name}</b><br>` +
                `Range: %{x}<br>` +
                `Damage: %{y}<br>` +
                `RPM: ${formatNumber(weapon.RPM)}<br>` +
                `DPS: ${formatNumber(weapon.DPS)}<br>` +
                `<extra></extra>`
        };
    });

    const layout = {
        ...CHART_LAYOUT_DEFAULTS,
        title: {
            text: `Weapon Damage vs Range (${weapons.length} weapons)`,
            font: { size: 20, color: '#fff' }
        },
        xaxis: {
            title: 'Range',
            gridcolor: '#333',
            color: '#ccc'
        },
        yaxis: {
            title: 'Damage per Shot',
            gridcolor: '#333',
            color: '#ccc',
            range: [0, Math.max(...weapons.flatMap(w => RANGES.map(r => w[r] || 0))) * 1.1]
        },
        legend: {
            orientation: 'v',
            x: 1.01,
            y: 1,
            font: { color: '#ccc', size: 10 },
            bgcolor: 'rgba(26, 26, 26, 0.8)',
            bordercolor: '#333',
            borderwidth: 1,
            traceorder: 'grouped'
        },
        showlegend: weapons.length <= 15,
        hovermode: 'closest',
        height: 600
    };

    Plotly.newPlot(containerId, traces, layout, CHART_CONFIG);
}

/**
 * Create TTK comparison chart
 * @param {Array} weapons - Array of weapon objects
 * @param {string} range - Range to compare (e.g., '10M')
 * @param {string} containerId - DOM element ID for chart
 */
function createTTKChart(weapons, range = '10M', containerId = 'ttkChart') {
    // Filter weapons with valid data for this range
    const validWeapons = weapons.filter(w =>
        w[range] !== null && w.RPM !== null
    );

    // Calculate TTK for each weapon based on selected method
    const weaponsWithTTK = validWeapons.map(w => {
        const method = (currentFilters && currentFilters.method)
            ? currentFilters.method
            : ((currentFilters && currentFilters.includeADS) ? 'ads' : 'hip');
        let ttk;
        if (method === 'recoil') {
            ttk = calculateRecoilAdjustedTTK(w[range], w.RPM, w.Precision, w.Control, range);
        } else {
            const adsTime = method === 'ads' ? w.ADS : 0;
            ttk = calculateTTK(w[range], w.RPM, adsTime);
        }
        return { ...w, calculatedTTK: ttk };
    });

    // Sort by calculated TTK (ascending - lower is better) and reverse for display
    const sortedWeapons = weaponsWithTTK.sort((a, b) => {
        return (a.calculatedTTK || Infinity) - (b.calculatedTTK || Infinity);
    }).reverse();

    // Extract TTK values for chart
    const ttksWithADS = sortedWeapons.map(w => w.calculatedTTK);

    const method = (currentFilters && currentFilters.method)
        ? currentFilters.method
        : ((currentFilters && currentFilters.includeADS) ? 'ads' : 'hip');
    const methodLabel = method === 'ads' ? 'ADS' : (method === 'recoil' ? 'Recoil Adjusted' : 'Hip Fire');

    const trace = {
        x: ttksWithADS,
        y: sortedWeapons.map(w => w.Weapon),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: sortedWeapons.map(w => getWeaponTypeColor(w['Weapon Type'])),
            line: { width: 1, color: '#fff' }
        },
        hovertemplate:
            `<b>%{y}</b><br>` +
            `TTK: %{x}ms<br>` +
            `Method: ${methodLabel}<br>` +
            `<extra></extra>`
    };

    const layout = {
        ...CHART_LAYOUT_DEFAULTS,
        title: {
            text: `Time-to-Kill at ${range} (${methodLabel})`,
            font: { size: 16, color: '#fff' }
        },
        xaxis: {
            title: 'TTK (milliseconds)',
            gridcolor: '#333',
            color: '#ccc'
        },
        yaxis: {
            title: '',
            gridcolor: '#333',
            color: '#ccc',
            automargin: true
        },
        showlegend: false,
        height: Math.max(400, sortedWeapons.length * 25)
    };

    Plotly.newPlot(containerId, [trace], layout, CHART_CONFIG);
}

/**
 * Create RPM vs DPS scatter plot
 * @param {Array} weapons - Array of weapon objects
 * @param {string} containerId - DOM element ID for chart
 */
function createRPMvsDPSChart(weapons, containerId = 'dpsChart') {
    const weaponTypes = [...new Set(weapons.map(w => w['Weapon Type']))];

    const traces = weaponTypes.map(type => {
        const typeWeapons = weapons.filter(w =>
            w['Weapon Type'] === type &&
            w.RPM !== null &&
            w.DPS !== null
        );

        return {
            x: typeWeapons.map(w => w.RPM),
            y: typeWeapons.map(w => w.DPS),
            type: 'scatter',
            mode: 'markers',
            name: type,
            marker: {
                color: getWeaponTypeColor(type),
                size: 12,
                line: { width: 2, color: '#fff' }
            },
            text: typeWeapons.map(w => w.Weapon),
            hovertemplate:
                `<b>%{text}</b><br>` +
                `RPM: %{x}<br>` +
                `DPS: %{y}<br>` +
                `<extra></extra>`
        };
    });

    const layout = {
        ...CHART_LAYOUT_DEFAULTS,
        title: {
            text: 'RPM vs DPS',
            font: { size: 16, color: '#fff' }
        },
        xaxis: {
            title: 'Rounds Per Minute (RPM)',
            gridcolor: '#333',
            color: '#ccc'
        },
        yaxis: {
            title: 'Damage Per Second (DPS)',
            gridcolor: '#333',
            color: '#ccc'
        },
        legend: {
            x: 0.02,
            y: 0.98,
            font: { color: '#ccc' }
        },
        showlegend: true
    };

    Plotly.newPlot(containerId, traces, layout, CHART_CONFIG);
}

/**
 * Create heatmap showing weapon performance across ranges
 * @param {Array} weapons - Array of weapon objects
 * @param {string} containerId - DOM element ID for chart
 */
function createRangeHeatmap(weapons, containerId = 'mainChart') {
    const weaponNames = weapons.map(w => w.Weapon);
    const ranges = RANGES.map(r => r.replace('M', 'm'));

    // Create TTK matrix
    const ttkMatrix = weapons.map(weapon =>
        RANGES.map(range => weapon[`TTK_${range}`] || null)
    );

    const trace = {
        z: ttkMatrix,
        x: ranges,
        y: weaponNames,
        type: 'heatmap',
        colorscale: [
            [0, '#00ff00'],    // Best (fastest TTK)
            [0.5, '#ffff00'],  // Medium
            [1, '#ff0000']     // Worst (slowest TTK)
        ],
        reversescale: true,
        hovertemplate:
            `<b>%{y}</b><br>` +
            `Range: %{x}<br>` +
            `TTK: %{z}ms<br>` +
            `<extra></extra>`,
        colorbar: {
            title: 'TTK (ms)',
            titleside: 'right',
            tickfont: { color: '#ccc' },
            titlefont: { color: '#ccc' }
        }
    };

    const layout = {
        ...CHART_LAYOUT_DEFAULTS,
        title: {
            text: 'TTK Heatmap by Range',
            font: { size: 20, color: '#fff' }
        },
        xaxis: {
            title: 'Range',
            gridcolor: '#333',
            color: '#ccc'
        },
        yaxis: {
            title: '',
            gridcolor: '#333',
            color: '#ccc',
            automargin: true
        },
        height: Math.max(500, weapons.length * 30)
    };

    Plotly.newPlot(containerId, [trace], layout, CHART_CONFIG);
}

/**
 * Create weapon type comparison chart (average stats by type)
 * @param {Array} weapons - Array of weapon objects
 * @param {string} containerId - DOM element ID for chart
 */
function createWeaponTypeComparison(weapons, containerId = 'mainChart') {
    const types = [...new Set(weapons.map(w => w['Weapon Type']))];

    const traces = RANGES.map((range, index) => {
        const avgDamages = types.map(type => {
            const typeWeapons = weapons.filter(w =>
                w['Weapon Type'] === type && w[range] !== null
            );
            if (typeWeapons.length === 0) return 0;
            return typeWeapons.reduce((sum, w) => sum + w[range], 0) / typeWeapons.length;
        });

        return {
            x: types,
            y: avgDamages,
            type: 'bar',
            name: range.replace('M', 'm'),
            marker: {
                line: { width: 1, color: '#fff' }
            },
            hovertemplate:
                `<b>%{x}</b><br>` +
                `Range: ${range}<br>` +
                `Avg Damage: %{y:.1f}<br>` +
                `<extra></extra>`
        };
    });

    const layout = {
        ...CHART_LAYOUT_DEFAULTS,
        title: {
            text: 'Average Damage by Weapon Type',
            font: { size: 20, color: '#fff' }
        },
        xaxis: {
            title: 'Weapon Type',
            gridcolor: '#333',
            color: '#ccc'
        },
        yaxis: {
            title: 'Average Damage',
            gridcolor: '#333',
            color: '#ccc'
        },
        barmode: 'group',
        legend: {
            x: 1.02,
            y: 1,
            font: { color: '#ccc' }
        }
    };

    Plotly.newPlot(containerId, traces, layout, CHART_CONFIG);
}

/**
 * Update chart with new data
 * @param {string} chartType - Type of chart to update
 * @param {Array} weapons - Filtered weapon data
 * @param {Object} options - Additional options (range, etc.)
 */
function updateChart(chartType, weapons, options = {}) {
    switch(chartType) {
        case 'damage':
            createDamageChart(weapons, options.containerId || 'mainChart');
            break;
        case 'ttk':
            createTTKChart(weapons, options.range || '10M', options.containerId || 'mainChart');
            break;
        case 'rpm-dps':
            createRPMvsDPSChart(weapons, options.containerId || 'mainChart');
            break;
        case 'heatmap':
            createRangeHeatmap(weapons, options.containerId || 'mainChart');
            break;
        case 'type-comparison':
            createWeaponTypeComparison(weapons, options.containerId || 'mainChart');
            break;
        default:
            console.warn('Unknown chart type:', chartType);
    }
}

/**
 * Clear a chart
 * @param {string} containerId - DOM element ID
 */
function clearChart(containerId) {
    Plotly.purge(containerId);
}

/**
 * Apply theme to charts
 * @param {boolean} isDark - Whether dark theme is active
 */
function applyChartTheme(isDark) {
    const bgColor = isDark ? '#121212' : '#ffffff';
    const plotBgColor = isDark ? '#1a1a1a' : '#f5f5f5';
    const gridColor = isDark ? '#333' : '#ddd';
    const textColor = isDark ? '#ccc' : '#333';

    CHART_LAYOUT_DEFAULTS.plot_bgcolor = plotBgColor;
    CHART_LAYOUT_DEFAULTS.paper_bgcolor = bgColor;
    CHART_LAYOUT_DEFAULTS.font.color = textColor;

    // Update grid colors in axis defaults
    const axisDefaults = {
        gridcolor: gridColor,
        color: textColor
    };

    Object.assign(CHART_LAYOUT_DEFAULTS.xaxis || {}, axisDefaults);
    Object.assign(CHART_LAYOUT_DEFAULTS.yaxis || {}, axisDefaults);
}

/**
 * Initialize all charts with initial data
 * @param {Array} weapons - Weapon data
 */
function initializeCharts(weapons) {
    // Main chart: Damage vs Range
    const completeWeapons = weapons.filter(isWeaponDataComplete);
    if (completeWeapons.length > 0) {
        createDamageChart(completeWeapons.slice(0, 10), 'mainChart');
    }

    // Secondary chart: TTK at 10M
    if (weapons.length > 0) {
        createTTKChart(weapons, '10M', 'ttkChart');
    }

    // Tertiary chart: RPM vs DPS
    const validWeapons = weapons.filter(w => w.RPM && w.DPS);
    if (validWeapons.length > 0) {
        createRPMvsDPSChart(validWeapons, 'dpsChart');
    }
}

/**
 * Export chart as image
 * @param {string} containerId - DOM element ID
 * @param {string} filename - Desired filename
 */
function exportChartAsImage(containerId, filename = 'chart.png') {
    Plotly.downloadImage(containerId, {
        format: 'png',
        width: 1200,
        height: 800,
        filename: filename
    });
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createDamageChart,
        createTTKChart,
        createRPMvsDPSChart,
        createRangeHeatmap,
        createWeaponTypeComparison,
        updateChart,
        clearChart,
        applyChartTheme,
        initializeCharts,
        exportChartAsImage
    };
}
