# ChaosTech NSD Radar Prototype

Real-time counter‑drone sandbox that simulates multiple drones, scores their threat level, and lets an operator jam/neutralize intruders around a protected base. [web:325][web:330]

## What it shows

- **Dynamic radar UI** with moving drone tracks, trails, and a rotating sweep.
- **Rule-based AI core** that scores threat by RF strength, geometry (distance to center), and speed.
- **Automatic & manual disruption**:
  - Auto-jam when a drone’s score crosses a threshold.
  - Click a track and use **Jam selected drone** to trigger manual jamming.
  - Jammed drones either **land in place** or **return to home**, depending on mode.
- **Protected base & no‑fly bubble**:
  - Central white square = critical asset.
  - Red inner ring = no‑fly radius.
  - Breach events are logged when drones penetrate the bubble.
- **Inner-ring zoom** panel that magnifies only the closest tracks.
- **Live effectiveness stats**:
  - Active / Jammed / Neutralized counts.
  - Run time, total neutralized, max concurrent intruders.
  - Breaches, stopped after breach, and drones that reached the base.

## How to run

1. Clone or download this repo.
2. Open `index.html` in a modern browser (Chrome/Edge/Firefox). No build step, no backend. [web:254]
3. For best results, view on desktop or laptop.

## How to play with it

1. Start with **Calm airspace** to see benign traffic.
2. Click **Attack run** to spawn multiple hostile drones.
3. Adjust the **RF / Center / Speed** sliders to change how aggressive the AI is.
4. Click a drone’s status line to mark it `[SELECTED]`, then press **Jam selected drone**.
5. Toggle disruption mode between **Land in place** and **Return to home** and watch how dots and stats change.

## Files

- `index.html` – UI layout, styles, and wiring of JS files.
- `ai_core.js` – Rule-based threat scoring logic.
- `scenarios.js` – Calm and attack drone scenarios.
- `radar_ui.js` – Radar visualization, animation loop, disruption logic, stats, and logs.

