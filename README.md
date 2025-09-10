# Never Hide — The Garazy (Interactive Starfield)

An accessible, responsive, lightweight interactive starfield built with HTML5 Canvas and vanilla JavaScript. Features:
- Full-screen dark background optimized for star visibility.
- Thousands of shimmering, twinkling stars in white, blue, gold and violet hues.
- Click/tap/swipe interaction: nearby stars swirl in a graceful spiral for ~10s; multiple taps intensify/restart the effect.
- After ~50s idle, stars cluster to form the text: "Never Hide. Is the master coding." made from star sparkles with soft pulsing glow.
- Optional ambient audio (user-toggleable).
- Fallback static star background + text if Canvas or animations are unsupported.
- Lightweight and optimized for performance on mobile and desktop. No frameworks required.

## Files
- `index.html` — main page
- `styles.css` — styling and fallback visuals
- `script.js` — all animation, interaction, and logic
- `assets/` — optional assets (e.g. `ambient.mp3`)

## Getting started / Deploy to GitHub Pages
1. Create a new repository on GitHub (e.g. `never-hide-garazy`).
2. Clone it locally:
   git clone git@github.com:your-username/never-hide-garazy.git
3. Copy the files from this repo into it (or upload via the GitHub web UI).
4. Add an optional `assets/ambient.mp3` file if you want ambient music.
5. Commit & push:
   git add .
   git commit -m "Initial garazy starfield"
   git push origin main
6. In the repository settings -> Pages, enable GitHub Pages for branch `main` (root). Your site will be published at `https://your-username.github.io/never-hide-garazy/`.

## Notes & Accessibility
- Ambient audio is off by default; user must click the control to enable playback (to respect browser autoplay policies).
- The fallback static background displays for non-JS / no-canvas environments.
- The animation conserves CPU on small devices by limiting particle counts and skipping heavy ops.

## Customize
- Edit color palette in `styles.css` and the `palette` array in `script.js`.
- Adjust particle density by changing the `DENSITY` constant in `script.js`.
- Replace or remove ambient sound by adding/removing `assets/ambient.mp3`.

If you'd like, I can:
- Create the GitHub repository and push these files for you (I would need your permission and repo name).
- Add a simple CI action to auto-deploy to GitHub Pages.
- Provide an optimized smaller build or export a single-file HTML for easy hosting.

Enjoy the garazy ✨
