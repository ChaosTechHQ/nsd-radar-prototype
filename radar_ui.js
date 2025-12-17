// NSD radar UI + animation + controls

// DOM elements
const map = document.getElementById("map");
const zoomMap = document.getElementById("zoomMap");
const logDiv = document.getElementById("log");
const calmBtn = document.getElementById("calmBtn");
const attackBtn = document.getElementById("attackBtn");
const pauseBtn = document.getElementById("pauseBtn");
const jamBtn = document.getElementById("jamBtn");
const statusBar = document.getElementById("statusBar");
const statsBar = document.getElementById("statsBar");
const disruptModeLabel = document.getElementById("disruptModeLabel");

// sliders
const rfSlider = document.getElementById("rfWeight");
const centerSlider = document.getElementById("centerWeight");
const speedSlider = document.getElementById("speedWeight");

const rfLabel = document.getElementById("rfWeightValue");
const centerLabel = document.getElementById("centerWeightValue");
const speedLabel = document.getElementById("speedWeightValue");

// state
let drones = cloneScenario(calmDrones);
let isPaused = false;
const TRAIL_LENGTH = 20;
const trails = new Map();
const seenHighThreat = new Set();
let selectedDroneName = null;
let disruptMode = "land"; // "land" or "rth"

// stats
let runStartTime = Date.now();
let neutralizedCount = 0;
let maxConcurrentIntruders = 0;

// base / no-fly zone
const baseRadius = 10; // in map units (0–100)
let breachCount = 0;
let stoppedBeforeBase = 0;
let reachedBase = 0;

// ---------- Radar background (rings + sweep + base) ----------

[100, 200, 300].forEach((diameter) => {
  const ring = document.createElement("div");
  ring.className = "radar-circle";
  ring.style.width = diameter + "px";
  ring.style.height = diameter + "px";
  ring.style.left = (400 - diameter) / 2 + "px";
  ring.style.top = (400 - diameter) / 2 + "px";
  map.appendChild(ring);
});

// base icon in center
const baseIcon = document.createElement("div");
baseIcon.style.position = "absolute";
baseIcon.style.width = "20px";
baseIcon.style.height = "20px";
baseIcon.style.left = "190px"; // 200 - 10
baseIcon.style.top = "190px";
baseIcon.style.backgroundColor = "#fff";
baseIcon.style.border = "2px solid red";
baseIcon.style.boxSizing = "border-box";
map.appendChild(baseIcon);

// no-fly circle (visual)
const baseCircle = document.createElement("div");
baseCircle.className = "radar-circle";
const baseDiameter = baseRadius * 4 * 2; // map units -> px
baseCircle.style.width = baseDiameter + "px";
baseCircle.style.height = baseDiameter + "px";
baseCircle.style.left = 200 - baseDiameter / 2 + "px";
baseCircle.style.top = 200 - baseDiameter / 2 + "px";
baseCircle.style.borderColor = "rgba(255,0,0,0.6)";
map.appendChild(baseCircle);

const radarLine = document.createElement("div");
radarLine.className = "radar-line";
radarLine.style.left = "199px";
radarLine.style.top = "0px";
map.appendChild(radarLine);

let sweepAngle = 0;
function updateSweep() {
  sweepAngle = (sweepAngle + 2) % 360;
  radarLine.style.transform = `rotate(${sweepAngle}deg)`;
}

// ---------- Controls ----------

function updateWeightLabels() {
  rfLabel.textContent = parseFloat(rfSlider.value).toFixed(1);
  centerLabel.textContent = parseFloat(centerSlider.value).toFixed(1);
  speedLabel.textContent = parseFloat(speedSlider.value).toFixed(1);
}

function getWeights() {
  return {
    rf: parseFloat(rfSlider.value),
    center: parseFloat(centerSlider.value),
    speed: parseFloat(speedSlider.value)
  };
}

rfSlider.oninput = centerSlider.oninput = speedSlider.oninput =
  function () {
    updateWeightLabels();
    redrawMap();
  };

updateWeightLabels();

function updateDisruptModeLabel() {
  disruptModeLabel.textContent =
    "Mode: " + (disruptMode === "land" ? "Land in place" : "Return to home");
}
updateDisruptModeLabel();

disruptModeLabel.onclick = () => {
  disruptMode = disruptMode === "land" ? "rth" : "land";
  updateDisruptModeLabel();
  logEvent(
    "Disruption mode set to: " +
      (disruptMode === "land" ? "Land in place" : "Return to home")
  );
};

function resetStats() {
  runStartTime = Date.now();
  neutralizedCount = 0;
  maxConcurrentIntruders = 0;
  breachCount = 0;
  stoppedBeforeBase = 0;
  reachedBase = 0;
}

calmBtn.onclick = () => {
  drones = cloneScenario(calmDrones);
  trails.clear();
  seenHighThreat.clear();
  selectedDroneName = null;
  resetStats();
  updateDisruptModeLabel();
  redrawMap();
};

attackBtn.onclick = () => {
  drones = cloneScenario(attackDrones);
  trails.clear();
  seenHighThreat.clear();
  selectedDroneName = null;
  resetStats();
  updateDisruptModeLabel();
  redrawMap();
};

pauseBtn.onclick = () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
};

// manual jam button
jamBtn.onclick = () => {
  if (!selectedDroneName) {
    logEvent("No drone selected to jam");
    return;
  }
  const target = drones.find(
    (d) => d.name === selectedDroneName && d.mode !== "neutralized"
  );
  if (!target) {
    logEvent("Selected drone not found / already neutralized");
    return;
  }
  if (target.mode === "jammed") {
    logEvent(selectedDroneName + " is already jammed");
    return;
  }

  target.mode = "jammed";
  target.jamTicks = 0;
  logEvent(selectedDroneName + " manually JAMMED");
};

// ---------- Event log ----------

function logEvent(text) {
  const line = document.createElement("div");
  const time = new Date().toLocaleTimeString();
  line.textContent = time + " - " + text;
  logDiv.prepend(line);
}

// ---------- Status + stats ----------

function updateStatusBar() {
  const active = drones.filter((d) => d.mode === "normal").length;
  const jammed = drones.filter((d) => d.mode === "jammed").length;
  const neutralized = drones.filter((d) => d.mode === "neutralized").length;
  statusBar.textContent =
    "Active: " +
    active +
    " | Jammed: " +
    jammed +
    " | Neutralized: " +
    neutralized;
}

function updateStatsBar() {
  const seconds = Math.floor((Date.now() - runStartTime) / 1000);
  const currentIntruders = drones.filter(
    (d) => d.mode !== "neutralized"
  ).length;
  if (currentIntruders > maxConcurrentIntruders) {
    maxConcurrentIntruders = currentIntruders;
  }
  statsBar.textContent =
    "Run time: " +
    seconds +
    " s | Neutralized: " +
    neutralizedCount +
    " | Max intruders: " +
    maxConcurrentIntruders +
    " | Breaches: " +
    breachCount +
    " (Stopped: " +
    stoppedBeforeBase +
    ", Reached base: " +
    reachedBase +
    ")";
}

// ---------- Draw + scoring ----------

function redrawMap() {
  const weights = getWeights();

  document.querySelectorAll(".drone-dot, .drone-icon").forEach((d) =>
    d.remove()
  );
  document.querySelectorAll(".trail-dot").forEach((d) => d.remove());
  zoomMap.innerHTML = "";

  const fixedIds = new Set([
    "about",
    "calmBtn",
    "attackBtn",
    "pauseBtn",
    "jamBtn",
    "disruptModeLabel",
    "controls",
    "statusBar",
    "statsBar",
    "map",
    "legend",
    "log",
    "mainRow",
    "leftCol",
    "rightCol",
    "zoomMap"
  ]);

  while (
    document.body.lastChild &&
    !fixedIds.has(document.body.lastChild.id) &&
    document.body.lastChild.tagName === "DIV"
  ) {
    const node = document.body.lastChild;
    if (node.id === "log" || node.id === "legend" || node.id === "map") break;
    document.body.removeChild(node);
  }

  const innerRadius = 20;

  drones.forEach((drone) => {
    const result = decideDroneStatus(drone, weights);

    if (result.score >= 80 && drone.mode === "normal") {
      drone.mode = "jammed";
      drone.jamTicks = 0;
      logEvent(drone.name + " JAMMED (auto, score " + result.score + ")");
    }

    const key = drone.name;
    if (result.status === "HIGH THREAT" && !seenHighThreat.has(key)) {
      seenHighThreat.add(key);
      logEvent(
        drone.name +
          " HIGH THREAT (score " +
          result.score +
          ", " +
          result.reason +
          ")"
      );
    }
    if (result.status !== "HIGH THREAT" && seenHighThreat.has(key)) {
      seenHighThreat.delete(key);
    }

    const trail = trails.get(drone.name) || [];
    trail.forEach((p) => {
      const tdot = document.createElement("div");
      tdot.className = "trail-dot";
      tdot.style.left = p.x * 4 + "px";
      tdot.style.top = p.y * 4 + "px";
      map.appendChild(tdot);
    });

    // choose icon shape and color
    let icon;
    if (drone.mode === "jammed") {
      icon = document.createElement("div");
      icon.className = "drone-icon dot-triangle";
    } else if (drone.mode === "neutralized") {
      icon = document.createElement("div");
      if (drone.neutralizedType === "land") {
        icon.className = "drone-icon dot-square";
      } else {
        icon.className = "drone-icon dot-diamond";
      }
    } else {
      icon = document.createElement("div");
      icon.className = "drone-icon dot-circle";
      if (result.score >= 70) {
        icon.style.backgroundColor = "red";
      } else if (result.score >= 40) {
        icon.style.backgroundColor = "yellow";
      } else if (result.score >= 10) {
        icon.style.backgroundColor = "lime";
      } else {
        icon.style.backgroundColor = "#004400";
      }
    }

    icon.style.left = drone.x * 4 + "px";
    icon.style.top = drone.y * 4 + "px";
    map.appendChild(icon);

    // inner-ring zoom
    const dx = drone.x - 50;
    const dy = drone.y - 50;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < innerRadius) {
      const z = document.createElement("div");
      z.className = icon.className;
      z.style.position = "absolute";
      const scale = 5;
      const zx = 100 + dx * scale;
      const zy = 100 + dy * scale;
      z.style.left = zx + "px";
      z.style.top = zy + "px";
      if (icon.style.backgroundColor) {
        z.style.backgroundColor = icon.style.backgroundColor;
      }
      zoomMap.appendChild(z);
    }

    const line = document.createElement("div");
    line.style.marginLeft = "10px";
    line.style.cursor = "pointer";
    line.textContent =
      (drone.name === selectedDroneName ? "[SELECTED] " : "") +
      drone.name +
      " -> " +
      result.status +
      " (" +
      drone.mode +
      ", score " +
      result.score +
      ", " +
      result.reason +
      ")";
    line.onclick = () => {
      selectedDroneName =
        selectedDroneName === drone.name ? null : drone.name;
      redrawMap();
    };
    document.body.appendChild(line);
  });

  updateStatusBar();
  updateStatsBar();
}

// ---------- Motion + trails + base breaches ----------

function updatePositions() {
  if (isPaused) return;

  drones.forEach((drone) => {
    if (drone.mode === "jammed") {
      drone.jamTicks = (drone.jamTicks || 0) + 1;

      if (disruptMode === "land") {
        if (drone.jamTicks < 20) {
          drone.x += (Math.random() - 0.5) * 0.2;
          drone.y += (Math.random() - 0.5) * 0.2;
        } else {
          drone.y += 0.15;
        }

        if (drone.jamTicks > 60) {
          drone.mode = "neutralized";
          drone.neutralizedType = "land";
          neutralizedCount++;
          // if this drone had breached and is still alive, it was stopped after breach
          if (drone.breachedBase) {
            stoppedBeforeBase++;
          }
          logEvent(drone.name + " NEUTRALIZED (landed)");
        }
      } else {
        const cx = 50;
        const cy = 50;

        if (drone.jamTicks < 20) {
          drone.x += (Math.random() - 0.5) * 0.2;
          drone.y += (Math.random() - 0.5) * 0.2;
        } else {
          const dx = cx - drone.x;
          const dy = cy - drone.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const step = 0.6;
          drone.x += (dx / dist) * step;
          drone.y += (dy / dist) * step;
        }

        if (Math.abs(drone.x - 50) < 1 && Math.abs(drone.y - 50) < 1) {
          drone.mode = "neutralized";
          drone.neutralizedType = "rth";
          neutralizedCount++;
          if (drone.breachedBase) {
            stoppedBeforeBase++;
          }
          logEvent(drone.name + " NEUTRALIZED (returned to home)");
        }
      }
    } else if (drone.mode === "normal") {
      const rad = (drone.heading * Math.PI) / 180;
      drone.x += Math.cos(rad) * drone.speed;
      drone.y += Math.sin(rad) * drone.speed;

      if (drone.x < 0 || drone.x > 100) {
        drone.heading = 180 - drone.heading;
      }
      if (drone.y < 0 || drone.y > 100) {
        drone.heading = 360 - drone.heading;
      }
    }

    // base breach detection (first time inside baseRadius)
    const dx = drone.x - 50;
    const dy = drone.y - 50;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (!drone.breachedBase && dist < baseRadius) {
      drone.breachedBase = true;
      breachCount++;
      logEvent(drone.name + " BASE BREACH (inside no-fly zone)");
    }

    if (drone.mode !== "neutralized") {
      if (!trails.has(drone.name)) {
        trails.set(drone.name, []);
      }
      const trail = trails.get(drone.name);
      trail.push({ x: drone.x, y: drone.y });
      if (trail.length > TRAIL_LENGTH) {
        trail.shift();
      }
    } else {
      // if drone was neutralized without ever breaching, and very close to center, count as reached base
      if (!drone.breachedBase && dist < baseRadius) {
        reachedBase++;
      }
    }
  });

  drones = drones.filter((d) => d.mode !== "neutralized");

  redrawMap();
}

redrawMap();
setInterval(updateSweep, 30);
setInterval(updatePositions, 100);
