# Battlefield 6 Time-to-Kill (TTK) Visualization

## Project Overview

This project provides an interactive web-based visualization of weapon statistics for Battlefield 6, specifically focusing on Time-to-Kill (TTK) metrics across different ranges and weapon types.

## Data Source

- **File**: `ttk.csv`
- **Structure**: Contains weapon damage data at various ranges (10M, 20M, 35M, 50M, 70M), RPM (Rounds Per Minute), and calculated DPS (Damage Per Second)
- **Weapon Categories**:
  - Assault Rifles
  - Carbines
  - SMGs (Submachine Guns)
  - LMGs (Light Machine Guns)
  - DMRs (Designated Marksman Rifles)

## Data Status

Note: Not all weapon statistics have been collected yet. Some weapons have incomplete data (empty fields in the CSV).

## Technology Stack

### Chosen: Plotly.js + Vanilla JavaScript

**Why Plotly.js?**
- ✅ Fully client-side - perfect for GitHub Pages static hosting
- ✅ No backend server required (unlike Dash/Streamlit)
- ✅ Highly interactive (hover tooltips, zoom, pan, legend toggling)
- ✅ Excellent for multi-series line charts and comparisons
- ✅ Built-in responsive design
- ✅ Free and open source

**Alternatives Considered:**
- ❌ **Dash**: Requires Python backend server (incompatible with GitHub Pages)
- ❌ **Streamlit**: Also requires backend server
- ⚠️ **D3.js**: More complex, steeper learning curve
- ⚠️ **Chart.js**: Less interactive, limited hover capabilities

## Project Goals

1. Create an interactive static website hosted on GitHub Pages
2. Visualize weapon TTK data across different ranges
3. Allow users to:
   - Compare weapons within the same category
   - Compare weapons across different categories
   - Filter by weapon type
   - View detailed stats on hover
   - Analyze damage drop-off at range
   - Compare DPS and RPM values

## Visualization Features to Implement

### Primary Visualizations

1. **Damage vs Range Chart** (Line Chart)
   - X-axis: Range (10M, 20M, 35M, 50M, 70M)
   - Y-axis: Damage
   - Multiple lines for different weapons
   - Color-coded by weapon type
   - Interactive legend to toggle weapons on/off

2. **TTK Comparison Chart** (Bar Chart or Line Chart)
   - Calculate actual TTK from damage values
   - Formula: TTK = (100 health / damage per shot) × (60 / RPM) × 1000 (in milliseconds)
   - Compare weapons at specific ranges

3. **RPM vs DPS Scatter Plot**
   - Show relationship between fire rate and damage output
   - Bubble size could represent damage at specific range
   - Color-coded by weapon type

4. **Weapon Category Comparison**
   - Side-by-side comparison of average performance by weapon type
   - Heatmap showing optimal ranges for each category

### Interactive Features

- **Dropdowns/Filters**: Select weapon types to display
- **Range Selector**: Focus on specific engagement ranges
- **Hover Tooltips**: Show exact values and weapon names
- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Theme Toggle**: Match gamer aesthetic preferences

## File Structure

```
ttm/
├── index.html          # Main visualization page
├── css/
│   └── style.css       # Custom styling
├── js/
│   ├── data.js         # CSV data loader
│   ├── charts.js       # Chart generation logic
│   └── utils.js        # Helper functions (TTK calculation, etc.)
├── data/
│   └── ttk.csv         # Weapon statistics data
├── README.md           # GitHub repo documentation
└── Claude.md           # This file
```

## Implementation Steps

1. **Setup HTML Structure**
   - Create responsive layout with chart containers
   - Add filter controls and UI elements
   - Link Plotly.js CDN

2. **Data Processing**
   - Parse CSV file (use Papa Parse or native fetch)
   - Clean and validate data
   - Calculate derived metrics (actual TTK values)

3. **Chart Creation**
   - Implement damage vs range visualization
   - Create TTK comparison charts
   - Add interactive controls

4. **Styling**
   - Apply Battlefield-themed color scheme (military greens, oranges)
   - Ensure responsive design
   - Add dark theme option

5. **GitHub Pages Deployment**
   - Push to GitHub repository
   - Enable GitHub Pages in repo settings
   - Set source to main branch / root or docs folder

## TTK Calculation Formula

To calculate Time-to-Kill in milliseconds:

```javascript
// Assuming 100 health in Battlefield
const health = 100;
const shotsToKill = Math.ceil(health / damagePerShot);
const timeBetweenShots = 60000 / rpm; // Convert RPM to milliseconds
const ttk = shotsToKill * timeBetweenShots;
```

## Data Considerations

- Handle missing data gracefully (some weapons have incomplete stats)
- Validate numeric values
- Consider weapon attachments (may affect stats in future iterations)
- Account for headshot multipliers (if data becomes available)

## Future Enhancements

- Add weapon images/icons
- Include recoil patterns
- Add magazine size and reload time data
- Implement weapon loadout builder
- Add meta analysis (best weapons per range/category)
- User ability to upload updated CSV data
- Comparison table view alongside charts

## GitHub Pages Deployment Checklist

- [ ] Create GitHub repository
- [ ] Push all files to main branch
- [ ] Go to Settings → Pages
- [ ] Select source: Deploy from branch (main)
- [ ] Choose folder: / (root) or /docs
- [ ] Wait for deployment (check Actions tab)
- [ ] Access site at: `https://<username>.github.io/<repo-name>/`

## Development Commands

Since this is a static site, no build process is required:

```bash
# For local development, use a simple HTTP server:
# Python 3
python -m http.server 8000

# Node.js (if you have npx)
npx serve

# Then open: http://localhost:8000
```

## Resources

- [Plotly.js Documentation](https://plotly.com/javascript/)
- [GitHub Pages Documentation](https://docs.github.com/pages)
- [Papa Parse (CSV Parser)](https://www.papaparse.com/)
- [Battlefield 6 Official Site](https://www.ea.com/games/battlefield)

## Notes for Claude/AI Assistance

When working on this project:
1. Prioritize client-side only solutions (no server-side code)
2. Ensure all visualizations work offline after initial page load
3. Keep the codebase simple and maintainable
4. Use CDN links for libraries (Plotly.js, Papa Parse) to avoid dependencies
5. Make calculations transparent and verifiable by users
6. Handle incomplete data gracefully (many weapons have missing stats)
7. Focus on usability for Battlefield players comparing weapon choices

## Contact & Contribution

This is a community project for Battlefield 6 players. Contributions to weapon data accuracy are welcome!
