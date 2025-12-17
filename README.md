# NSD Drone Brain Demo

A tiny web demo that shows an AI "drone brain" deciding if drones are SAFE or THREAT.

## What this project does

- `ai_core.js` contains a function `decideDroneStatus(drone)` that:
  - Reads fields like distance, speed (and later RF strength).
  - Applies simple rules to label each drone as `"SAFE"` or `"THREAT"`.
  - Returns both a `status` and a `reason`.

- `index.html`:
  - Loads `ai_core.js` in the browser.
  - Calls `decideDroneStatus` for three example drones.
  - Shows the status and reason text on the page.
  - Colors threats red and safe drones green.

## How to run it

- Open the `index.html` file in a web browser (for example, Chrome).
- You will see the drone decisions on the page.

## Next ideas

- Add more inputs (altitude, RF strength, swarm size).
- Add more drones and rules.
- Turn each drone into a colored dot on a 2D map.
