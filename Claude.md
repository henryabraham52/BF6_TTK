# Battlefield 6 Time-to-Kill (TTK) Visualization

## Project Overview (current)
Interactive, client-only web app (Plotly.js + Vanilla JS) to analyze weapon stats and Time-to-Kill (TTK) across ranges. Supports Hip Fire, ADS, and a Recoil Adjusted method with a configurable impact slider.

## Data Source
- **File**: `data/ttk.csv`
- **Schema**: `Weapon Type, Weapon, 10M, 20M, 35M, 50M, 70M, RPM, DPS, ADS, Precision, Control`
- **Normalization**: Any exact damage value of 33 is treated as 33.5 at load time.
- **Categories**: Assault Rifle, Carbine, SMG, LMG, DMR, Sniper Rifle, Shotgun, Pistol

## Current Status
- Client-side only; hosted via GitHub Pages
- All weapons include ADS, Precision, Control
- Range selector defaults to 10M (no "All Ranges")
- Method dropdown includes: Hip Fire, ADS, Recoil Adjusted
- Recoil Impact slider (1–5, default 4) shown when Recoil Adjusted is selected

## Methodology
### Base TTK (Hip/ADS)
- Health = 100
- ShotsToKill = ceil(Health / Damage)
- TimeBetweenShots(ms) = 60000 / RPM
- TTK(ms) = (ShotsToKill - 1) × TimeBetweenShots + ADS (ADS method only)

### Recoil Adjusted (hipfire-only)
- p_base = (Precision/100) × (Control/100)
- Range multiplier m(r): 10m=1.0 (min 0.90 floor), 20m=0.95, 35m=0.90, 50m=0.85, 70m=0.80
- Impact scaling: α = impact/4 where impact ∈ {1..5}, default 4
- p = min{1.0, max{0.05, 1 − (1 − (p_base·m(r)))·α}}
- expectedShots = ShotsToKill / p (expected value)
- TTK(ms) = (expectedShots − 1) × (60000 / RPM)
- Sniper Rifles and Shotguns are immune: p=1 (no penalty)

## UI/Controls
- Weapon Type filter (multi-select)
- Focus Range selector (10M, 20M, 35M, 50M, 70M) — default 10M
- Chart View: Damage vs Range, TTK Comparison, RPM vs DPS
- Method: Hip Fire, ADS, Recoil Adjusted
- Recoil Impact slider: 1–5 (default 4)
- Search, Reset, Compare All, Export CSV

## Visualizations (implemented)
- Damage vs Range (lines)
- TTK Comparison at selected range (bars)
- RPM vs DPS (scatter)

## Tech Stack
- Plotly.js, Papa Parse, Vanilla JS, CSS Grid/Flexbox; GitHub Pages hosting

## Notes for Claude/AI Assistance
- Keep everything client-side; use CDN scripts
- Respect current schema (include ADS, Precision, Control)
- Recoil method uses expected value; do not simulate recoil patterns
- Snipers/Shotguns immune to recoil penalties
- Default range is 10M; no "All Ranges"
- Damage 33 → 33.5 normalization happens at load

## Dev
- Local server: `python -m http.server 8000` or `npx serve`
- Entry: `index.html`; JS modules in `js/`; data in `data/ttk.csv`
- No build step; push to GitHub Pages
