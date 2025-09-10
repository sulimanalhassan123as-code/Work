```markdown
# Never Hide — Interactive Golden Box

This project is a single-page interactive experience centered around a shiny golden box that opens, reveals a glowing message and transforms into animated mascot/robot characters. The design emphasizes a deep dark background with golden accents.

Files:
- index.html — the page layout and inline SVG elements.
- styles.css — all styling and CSS animations.
- script.js — orchestration of the interactive animation sequence and optional sound.

How to run:
1. Place the files in the same folder.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).
3. Tap or click the golden box to start the animation sequence. Use the "Sound" toggle to enable or disable audio. Use the Reset button to return to the start.

Notes & features:
- Uses Google Fonts (Playfair Display + Poppins) for a classy + tech look.
- Accessible: the golden box is a button element, supports keyboard (Enter / Space) and has ARIA attributes.
- Reduced-motion users: the page respects `prefers-reduced-motion` and switches to a simplified static fallback.
- Sound is optional, implemented via WebAudio (no external audio files).
- Responsive: sizes use CSS clamp() and the layout adapts for mobile screens.

Customization:
- Colors and timing are controlled via CSS variables and the TIMINGS object in `script.js`.
- You can replace or expand the SVG mascot/robot for more elaborate morphing sequences.
- If you want to use recorded ambient or shimmer sounds instead of WebAudio synthesis, update the JS to load audio files and play them.

Enjoy — tap repeatedly to watch the animations loop and evolve!
```
