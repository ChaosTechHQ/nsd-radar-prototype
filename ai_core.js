// ChaosTech NSD AI Core v4.0 - Allies + global disruption

let drones = [];
let infraMarkers = [];
let weights = { rf: 1.0, center: 1.0, speed: 1.0 };
let selectedDrone = null;
let isPaused = false;

// Disruption modes
let disruptMode = 'land'; // 'land' | 'return' | 'corridor'

// Weights
function updateWeights() {
  weights.rf = parseFloat(document.getElementById('rfWeight').value) || 1.0;
  weights.center = parseFloat(document.getElementById('centerWeight').value) || 1.0;
  weights.speed = parseFloat(document.getElementById('speedWeight').value) || 1.0;
}

// Threat scoring
function decideDroneStatus(drone) {
  // Allies are always safe
  if (drone.side === 'ally') {
    return {
      score: 0,
      reasons: 'friendly / IFF positive',
      distanceToCenter: 0
    };
  }

  const dx = drone.x - 50;
  const dy = drone.y - 50;
  const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

  let infraBoost = 0;
  let closeInfra = null;
  infraMarkers.forEach(m => {
    const ddx = drone.x - m.x;
    const ddy = drone.y - m.y;
    const d = Math.sqrt(ddx * ddx + ddy * ddy);
    if (d < 10) {
      const base = m.type === 'critical' ? 30 : 15;
      if (base > infraBoost) {
        infraBoost = base;
        closeInfra = m;
      }
    }
  });

  let score = 0;
  let reasons = [];

  if (drone.rfStrength > 80) {
    score += 40 * weights.rf;
    reasons.push('strong RF');
  } else if (drone.rfStrength > 50) {
    score += 20 * weights.rf;
    reasons.push('medium RF');
  }

  if (distanceToCenter < 20) {
    score += 35 * weights.center;
    reasons.push('core zone');
  } else if (distanceToCenter < 35) {
    score += 15 * weights.center;
    reasons.push('inner band');
  }

  if (drone.speed > 20) {
    score += 25 * weights.speed;
    reasons.push('high speed');
  }

  if (infraBoost > 0 && closeInfra) {
    score += infraBoost;
    reasons.push(`near ${closeInfra.label}`);
  }

  score = Math.min(100, score);

  return {
    score,
    reasons: reasons.length ? reasons.join(', ') : 'no major factors',
    distanceToCenter
  };
}

// Cycle disruption mode
function cycleDisruptMode() {
  const modes = ['land', 'return', 'corridor'];
  const idx = modes.indexOf(disruptMode);
  disruptMode = modes[(idx + 1) % modes.length];

  const txt = {
    land: 'Land in place',
    return: 'Return to base',
    corridor: 'Push to safe corridor'
  }[disruptMode];

  const el = document.getElementById('disruptModeLabel');
  if (el) el.textContent = `Mode: ${txt}`;
  logEvent(`Disruption mode set to: ${txt}`, 'info');
}

// Auto-jam seed (hostiles only, and only extreme threats)
function checkAutoJam() {
  drones.forEach(drone => {
    if (
      drone.side !== 'ally' &&
      (drone.mode === 'active' || drone.mode === 'normal')
    ) {
      const status = decideDroneStatus(drone);
      if (status.score >= 95) {
        drone.mode = 'jammed';
        drone.jamTime = Date.now();
        logEvent(
          `AUTO-JAM SEED: ${drone.name} (${status.score.toFixed(0)}: ${status.reasons})`,
          'threat'
        );
      }
    }
  });
}

// GLOBAL jam: only hostiles are jammed
function jamAllDrones(sourceLabel = 'Operator') {
  let count = 0;
  const now = Date.now();
  drones.forEach(drone => {
    if (
      drone.side !== 'ally' &&
      (drone.mode === 'active' || drone.mode === 'normal')
    ) {
      drone.mode = 'jammed';
      drone.jamTime = now;
      count++;
    }
  });
  if (count > 0) {
    logEvent(
      `${sourceLabel} JAM: ${count} hostile drones captured simultaneously (${disruptMode} mode).`,
      'jam'
    );
  } else {
    logEvent(`${sourceLabel} JAM: no hostile drones to capture.`, 'info');
  }
}

// Neutralize
function neutralizeDrone(drone) {
  if (!drone || drone.mode === 'neutralized') return;
  drone.mode = 'neutralized';
  logEvent(`NEUTRALIZED: ${drone.name}`, 'neutralized');
}

// Event log
const log = document.getElementById('log');

function logEvent(message, type = 'info') {
  if (!log) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  log.insertBefore(entry, log.firstChild);
  log.scrollTop = 0;
}

// Status bar
function updateStatusBar(active, jammed, neutralized) {
  const s = document.getElementById('statusBar');
  if (!s) return;
  s.textContent = `Active: ${active} | Jammed: ${jammed} | Neutralized: ${neutralized}`;
}

// Reset
function resetSimulation() {
  drones = [];
  infraMarkers = [];
  selectedDrone = null;
  logEvent('Simulation reset.');
  if (typeof redrawMap === 'function') redrawMap();
  updateStatusBar(0, 0, 0);
}
