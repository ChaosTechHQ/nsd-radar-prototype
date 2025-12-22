# ChaosTech NSD Field Grid Prototype

Real‑time counter‑UAS sandbox that simulates hostile swarms, allied assets, and US drones over a rectangular base‑defense grid. The prototype shows how an NSD‑style AI could visualize, score, and disrupt multiple drones in one view.

## Demo Overview

- Rectangular **field grid** with center “protected core” box.
- Hostile drones (swarm + patrol) with threat scoring based on RF strength, geometry, speed, and proximity to infrastructure.
- **Allied / US drones** rendered as blue tracks that are never jammed (IFF‑positive).
- **Global disruption** control: “Jam all drones” captures all hostile drones at once, then applies one of three modes:
  - Land in place
  - Return to base
  - Push to safe corridor
- Clickable drone list and map selection for quick inspection.
- Event log with filters for threats, jams, neutralization, and infrastructure events.

## Features

- **AI threat model**  
  JavaScript function that returns a 0–100 score plus human‑readable reasons for each hostile drone (RF, core zone, near infrastructure, high speed, etc.).

- **Allies & US drones**  
  Allies are added from a dedicated form, stored separately from hostiles, and rendered with distinct color and trails. The AI always treats them as safe and excludes them from global jamming.

- **Scenario + infrastructure editor**  
  - Buttons for “Calm airspace” and “Attack run” load canned scenarios.
  - Custom hostile drones can be injected with name, position, speed, heading, and RF.
  - Infrastructure markers (critical sites, land bases, sea bases, mobile units) can be added anywhere on the grid and feed into threat scoring.

- **Accessibility & UI**  
  - Uses semantic landmarks (`header`, `main`, complementary sections) and `role="log"` on the event feed.
  - Color‑plus‑pattern legend to help colorblind users distinguish threat levels and infrastructure types.
  - Screen‑reader‑friendly drone list that mirrors what is drawn on the canvas.

## How to Run

1. Clone the repo.
2. Open `index.html` directly in a modern browser (Chrome, Edge, Firefox).
3. No build step or backend is required; everything runs client‑side in vanilla HTML/CSS/JS.

## Files

- `index.html` – layout, ARIA landmarks, controls, and panels.
- `styles.css` – green‑on‑black radar styling, responsive grid layout, legend, and log.
- `ai_core.js` – NSD “brain” for threat scoring, global jamming, and status updates.
- `scenarios.js` – calm / attack scenarios plus default allied drones.
- `radar_ui.js` – canvas rendering, movement loop, editors, and event log wiring.

## Roadmap

- Add time‑to‑impact estimates and predicted intercept points.
- Visualize aggregate risk over time as a strip chart.
- Experiment with more detailed NATO 2525‑style symbology for friendly vs hostile vs neutral contacts.

