# Contributing to Battlefield 6 TTK Visualization

First off, thank you for considering contributing to this project! 🎉

The Battlefield 6 TTK Visualization is a community-driven project, and we welcome contributions from players and developers alike. This document provides guidelines for contributing to make the process smooth and effective for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Adding Weapon Data](#adding-weapon-data)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Code Contributions](#code-contributions)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Data Guidelines](#data-guidelines)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## 🤝 How Can I Contribute?

### Adding Weapon Data

**This is the most valuable contribution!** Many weapons still have incomplete statistics.

#### Finding Weapons to Add

1. Check the live site for weapons marked as "Incomplete"
2. Look at [open issues](https://github.com/henryabraham52/BF6_TTK/issues?q=is%3Aissue+is%3Aopen+label%3A%22data+needed%22) with the `data needed` label
3. Review `data/ttk.csv` for empty fields

#### How to Add Weapon Data

**Method 1: Direct CSV Edit (Recommended for data-only changes)**

1. Fork the repository
2. Edit `data/ttk.csv` directly in GitHub's web editor
3. Add or update weapon statistics
4. Create a pull request with a descriptive title like: "Add data for KORD 6P67"

**Method 2: Issue Report (If you don't want to edit files)**

1. [Create a new issue](https://github.com/henryabraham52/BF6_TTK/issues/new)
2. Use the title format: "Weapon Data: [Weapon Name]"
3. Include all available stats in the issue body

#### Data Collection Guidelines

**Where to Get Data:**
- Official Battlefield 6 stats (preferred)
- Symthic or similar community databases
- In-game testing (provide methodology)
- Reputable YouTube channels (cite source)

**Required Fields:**
```csv
Weapon Type,Weapon,10M,20M,35M,50M,70M,RPM,DPS
ASSAULT RIFLE,Example Gun,25,25,21,20,20,830,20750
```

**Data Quality Standards:**
- ✅ Verify data from multiple sources when possible
- ✅ Round damage values to whole numbers
- ✅ Use exact RPM values (not approximations)
- ✅ Calculate DPS as: `(Damage × RPM) / 60 × Rate of Fire`
- ✅ Include source in PR description

**Example Pull Request Description:**
```
## Weapon Data: AK4D

### Statistics Added
- 10M Damage: 33
- 20M Damage: 33
- 35M Damage: 25
- 50M Damage: 25
- 70M Damage: 25
- RPM: 514
- DPS: 16962

### Source
- Tested in-game practice range (2025-01-15)
- Cross-referenced with Symthic database
```

### Reporting Bugs

Found a bug? Help us fix it!

#### Before Submitting

1. **Check existing issues** - Someone may have already reported it
2. **Verify the bug** - Can you consistently reproduce it?
3. **Test in different browsers** - Is it browser-specific?

#### Submitting a Bug Report

Use our [Bug Report Template](https://github.com/henryabraham52/BF6_TTK/issues/new?template=bug_report.yml)

**Include:**
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable
- Browser and OS information
- Console errors (press F12 → Console)

**Good Example:**
```
Title: TTK calculation incorrect for weapons with >900 RPM

Steps:
1. Select "M4A1" (900 RPM)
2. View TTK at 10M
3. Expected: ~190ms
4. Actual: Shows 240ms

Browser: Chrome 120.0
Console Error: [None]
```

### Suggesting Features

We love new ideas! 💡

#### Before Suggesting

1. Check [existing feature requests](https://github.com/henryabraham52/BF6_TTK/labels/enhancement)
2. Review the [roadmap in README.md](README.md#features-roadmap)
3. Consider if it aligns with the project's scope

#### Submitting a Feature Request

Use our [Feature Request Template](https://github.com/henryabraham52/BF6_TTK/issues/new?template=feature_request.yml)

**Include:**
- Clear description of the feature
- Use case / problem it solves
- Proposed solution or mockup
- Alternative solutions considered

**Good Example:**
```
Title: Add headshot multiplier calculations

Use Case:
Players want to know optimal TTK with headshots, not just body shots.

Proposed Solution:
- Add "Headshot Multiplier" column to CSV (default: 2x)
- Add toggle in UI: "Include Headshots"
- Calculate separate TTK values

Benefits:
- More accurate meta analysis
- Helps players understand skill ceiling
```

### Code Contributions

#### Types of Code Contributions

- 🐛 **Bug Fixes** - Fix reported issues
- ✨ **Features** - Implement new functionality
- 🎨 **UI/UX** - Improve design and usability
- ⚡ **Performance** - Optimize code
- 📝 **Documentation** - Improve docs and comments
- ♻️ **Refactoring** - Improve code quality

## 💻 Development Setup

### Prerequisites

No complex setup required! Just:
- A code editor (VS Code recommended)
- A local web server (Python, Node.js, or PHP)
- A modern web browser

### Setup Steps

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/BF6_TTK.git
   cd BF6_TTK
   ```

2. **Start Local Server**
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js
   npx serve

   # PHP
   php -S localhost:8000
   ```

3. **Open in Browser**
   ```
   http://localhost:8000
   ```

4. **Make Changes**
   - Edit files in your favorite editor
   - Refresh browser to see changes
   - Check browser console (F12) for errors

### Project Architecture

```
ttm/
├── index.html       # Main page structure
├── css/style.css    # All styles
├── js/
│   ├── utils.js     # Helper functions (TTK calc, etc.)
│   ├── data.js      # CSV loading and data processing
│   ├── charts.js    # Plotly.js chart generation
│   └── main.js      # App initialization & event handlers
└── data/ttk.csv     # Weapon statistics
```

**Module Dependencies:**
```
main.js → depends on → data.js, charts.js, utils.js
data.js → depends on → utils.js
charts.js → depends on → utils.js
utils.js → standalone (no dependencies)
```

## 🔄 Pull Request Process

### 1. Create a Branch

```bash
# For features
git checkout -b feature/weapon-attachments

# For bug fixes
git checkout -b fix/ttk-calculation-error

# For data additions
git checkout -b data/add-kord-6p67
```

### 2. Make Your Changes

- Write clean, commented code
- Follow existing code style
- Test thoroughly in multiple browsers
- Update documentation if needed

### 3. Test Your Changes

**Checklist:**
- [ ] Code works in Chrome, Firefox, and Safari
- [ ] No console errors (F12 → Console)
- [ ] Responsive on mobile (F12 → Device Toolbar)
- [ ] All charts render correctly
- [ ] CSV export works
- [ ] Theme toggle works
- [ ] No broken links

### 4. Commit Your Changes

Use clear, descriptive commit messages:

```bash
# Good commits
git commit -m "Add weapon data for KORD 6P67 and NWO-228E"
git commit -m "Fix TTK calculation for high RPM weapons"
git commit -m "Add headshot multiplier toggle feature"

# Bad commits
git commit -m "fix stuff"
git commit -m "updates"
```

**Commit Message Guidelines:**
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues: "Fix TTK calc (closes #123)"

### 5. Push and Create PR

```bash
git push origin feature/weapon-attachments
```

Then:
1. Go to GitHub and create a Pull Request
2. Fill out the PR template completely
3. Link related issues (e.g., "Closes #123")
4. Wait for review

### 6. Code Review Process

- Maintainers will review within 1-3 days
- You may receive feedback or change requests
- Address feedback and push updates
- Once approved, your PR will be merged!

## 🎨 Style Guidelines

### JavaScript

```javascript
// Use const/let (not var)
const weaponData = loadWeaponData();
let filteredWeapons = [];

// Use descriptive names
function calculateTimeToKill(damage, rpm) { ... }  // Good
function calc(d, r) { ... }                        // Bad

// Add comments for complex logic
// Calculate shots to kill, rounding up for partial damage
const shotsToKill = Math.ceil(PLAYER_HEALTH / damage);

// Use template literals
const message = `${weapon.name} deals ${damage} damage`;

// Handle errors gracefully
try {
    const data = await loadWeaponData();
} catch (error) {
    console.error('Failed to load data:', error);
    showError('Could not load weapon data');
}
```

### CSS

```css
/* Use CSS variables for colors */
.weapon-card {
    background-color: var(--bg-card);
    color: var(--text-primary);
}

/* Use BEM-like naming for clarity */
.weapon-table { }
.weapon-table__row { }
.weapon-table__cell--highlight { }

/* Mobile-first responsive design */
.chart-container {
    width: 100%;
}

@media (min-width: 768px) {
    .chart-container {
        width: 50%;
    }
}
```

### HTML

```html
<!-- Use semantic HTML -->
<section class="stats-section">
    <h2>Statistics</h2>
    <!-- content -->
</section>

<!-- Include accessibility attributes -->
<button aria-label="Toggle dark theme" id="themeToggle">
    🌙
</button>

<!-- Use meaningful IDs and classes -->
<div id="mainChart" class="chart-container"></div>
```

## 📊 Data Guidelines

### CSV Format

```csv
Weapon Type,Weapon,10M,20M,35M,50M,70M,RPM,DPS
ASSAULT RIFLE,M433,25,25,21,20,20,830,20750
```

### Rules

1. **Weapon Types** (must match exactly):
   - `ASSAULT RIFLE`
   - `CARBINE`
   - `SMG`
   - `LMG`
   - `DMR`

2. **Damage Values**:
   - Whole numbers only
   - Leave empty if unknown (don't use 0, N/A, or ?)

3. **RPM**:
   - Exact value (e.g., 830, not ~800)
   - Whole number

4. **DPS Calculation**:
   ```
   DPS = (Damage at 10M × RPM) / 60
   Example: (25 × 830) / 60 = 20750
   ```

5. **No Duplicates**:
   - Each weapon should appear only once
   - If updating, modify existing entry

### Validation

Before submitting, verify:
- [ ] No empty weapon names
- [ ] No duplicate weapons
- [ ] All damage values are numbers or empty
- [ ] RPM is a positive number
- [ ] DPS matches calculation: `(10M damage × RPM) / 60`
- [ ] Weapon type matches allowed values

## ❓ Questions?

- **General Questions**: [Start a Discussion](https://github.com/yourusername/ttm/discussions/new)
- **Report Issues**: [Create an Issue](https://github.com/yourusername/ttm/issues/new)
- **Unclear Guidelines**: Open an issue to improve this document!

## 🎖️ Recognition

All contributors will be:
- Listed in the project's contributors page
- Credited in release notes
- Shown in the GitHub contributors graph

Significant contributions may be highlighted in the README!

---

**Thank you for contributing to the Battlefield community! 🎮**

Your efforts help players make informed decisions and improve their gameplay experience.
