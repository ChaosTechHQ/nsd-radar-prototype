// ChaosTech NSD Field Grid UI v4.0 - Allies + global disruption

const map = document.getElementById('map');
const ctx = map.getContext('2d');

const calmBtn = document.getElementById('calmBtn');
const attackBtn = document.getElementById('attackBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const jamBtn = document.getElementById('jamBtn');
const disruptModeLabel = document.getElementById('disruptModeLabel');

const logFilter = document.getElementById('logFilter');
const clearLogBtn = document.getElementById('clearLog');

const seName = document.getElementById('seName');
const seX = document.getElementById('seX');
const seY = document.getElementById('seY');
const seSpeed = document.getElementById('seSpeed');
const seHeading = document.getElementById('seHeading');
const seRF = document.getElementById('seRF');
const seAddBtn = document.getElementById('seAddBtn');
const seNote = document.getElementById('seNote');

const infLabel = document.getElementById('infLabel');
const infType = document.getElementById('infType');
const infX = document.getElementById('infX');
const infY = document.getElementById('infY');
const infAddBtn = document.getElementById('infAddBtn');
const infNote = document.getElementById('infNote');

const allyName = document.getElementById('allyName');
const allyX = document.getElementById('allyX');
const allyY = document.getElementById('allyY');
const allySpeed = document.getElementById('allySpeed');
const allyHeading = document.getElementById('allyHeading');
const allyAddBtn = document.getElementById('allyAddBtn');
const allyNote = document.getElementById('allyNote');

const TRAIL_LENGTH = 10;
const trails = new Map();

// Resize canvas
function resizeCanvas() {
  const rect = map.getBoundingClientRect();
  map.width = rect.width;
  map.height = rect.height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* Scenarios */
function startCalm() {
  drones = calmDrones.map(cloneScenario);
  runtimeAlliedDrones.forEach(a => drones.push(cloneScenario(a)));
  trails.clear();
  infraMarkers = [
    { label: 'HQ', type: 'land', x: 50, y: 50 },
    { label: 'Radar Hill', type: 'critical', x: 30, y: 30 }
  ];
  logEvent('Calm field scenario with allies loaded.', 'info');
  redrawMap();
}

function startAttack() {
  drones = attackDrones.map(cloneScenario);
  runtimeAlliedDrones.forEach(a => drones.push(cloneScenario(a)));
  trails.clear();
  infraMarkers = [
    { label: 'HQ', type: 'land', x: 50, y: 50 },
    { label: 'Fuel Farm', type: 'critical', x: 65, y: 60 },
    { label: 'Sea Base', type: 'sea', x: 90, y: 80 }
  ];
  logEvent('Attack corridor scenario with allies loaded.', 'info');
  redrawMap();
}

/* Editors */
function addCustomDrone() {
  const name = seName.value || 'Custom';
  const x = Number(seX.value);
  const y = Number(seY.value);
  const speed = Number(seSpeed.value);
  const heading = Number(seHeading.value);
  const rf = Number(seRF.value);

  if (
    Number.isNaN(x) || Number.isNaN(y) ||
    Number.isNaN(speed) || Number.isNaN(heading) || Number.isNaN(rf)
  ) {
    seNote.textContent = 'Enter valid numbers for all fields.';
    return;
  }

  const d = {
    name,
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
    speed: Math.max(1, Math.min(30, speed)),
    heading: ((heading % 360) + 360) % 360,
    rfStrength: Math.max(0, Math.min(100, rf)),
    mode: 'active',
    side: 'enemy'
  };

  drones.push(d);
  attackDrones.push(JSON.parse(JSON.stringify(d)));
  seNote.textContent = `Added ${name} at (${d.x}, ${d.y}) heading ${d.heading}°.`;
  logEvent(`Custom hostile drone added: ${name}`, 'info');
  redrawMap();
}

function addInfrastructureMarker() {
  const label = infLabel.value || 'Site';
  const type = infType.value;
  const x = Number(infX.value);
  const y = Number(infY.value);

  if (Number.isNaN(x) || Number.isNaN(y)) {
    infNote.textContent = 'Enter valid X and Y.';
    return;
  }

  const m = {
    label,
    type,
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y))
  };
  infraMarkers.push(m);
  infNote.textContent = `Added ${label} (${type}) at (${m.x}, ${m.y}).`;
  logEvent(`Infrastructure added: ${label} (${type})`, 'infra');
  redrawMap();
}

function addAllyDrone() {
  const name = allyName.value || 'Ally';
  const x = Number(allyX.value);
  const y = Number(allyY.value);
  const speed = Number(allySpeed.value);
  const heading = Number(allyHeading.value);

  if (Number.isNaN(x) || Number.isNaN(y) ||
      Number.isNaN(speed) || Number.isNaN(heading)) {
    allyNote.textContent = 'Enter valid numbers for all ally fields.';
    return;
  }

  const ally = {
    name,
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
    speed: Math.max(1, Math.min(30, speed)),
    heading: ((heading % 360) + 360) % 360,
    rfStrength: 40,
    mode: 'ally',
    side: 'ally'
  };

  // Add to runtime ally collection and live drones
  runtimeAlliedDrones.push(cloneScenario(ally));
  drones.push(ally);

  allyNote.textContent = `Added ally ${name} at (${ally.x}, ${ally.y}) heading ${ally.heading}°.`;
  logEvent(`Ally / US drone added: ${name}`, 'info');
  redrawMap();
}

/* Selection */
function selectDrone(drone) {
  selectedDrone = drone;
  drones.forEach(d => (d.selected = d === drone));
  redrawMap();
}

/* Movement */
function updatePositions() {
  if (isPaused) return;

  drones.forEach(drone => {
    if (drone.mode === 'jammed') {
      const elapsed = Date.now() - drone.jamTime;

      if (elapsed < 2000) {
        drone.x += (Math.random() - 0.5) * 0.2;
        drone.y += (Math.random() - 0.5) * 0.2;
      } else {
        if (disruptMode === 'land') {
          drone.y += 0.8;
        } else if (disruptMode === 'return') {
          const dx = 50 - drone.x;
          const dy = 50 - drone.y;
          drone.x += dx * 0.02;
          drone.y += dy * 0.02;
        } else if (disruptMode === 'corridor') {
          const dx = 90 - drone.x;
          drone.x += dx * 0.025;
          drone.y += 0.6;
        }
        if (drone.y > 110 || drone.x < -10 || drone.x > 110) {
          neutralizeDrone(drone);
        }
      }
    } else if (drone.mode === 'active' || drone.mode === 'normal' || drone.mode === 'ally') {
      if (drone.side === 'ally') {
        // Allies move gently
        drone.x += Math.cos((drone.heading * Math.PI) / 180) * drone.speed * 0.02;
        drone.y += Math.sin((drone.heading * Math.PI) / 180) * drone.speed * 0.02;
      } else {
        // Hostiles use main speed
        drone.x += Math.cos((drone.heading * Math.PI) / 180) * drone.speed * 0.04;
        drone.y += Math.sin((drone.heading * Math.PI) / 180) * drone.speed * 0.04;
      }

      if (drone.x <= 0 || drone.x >= 100) drone.heading = 180 - drone.heading;
      if (drone.y <= 0 || drone.y >= 100) drone.heading = -drone.heading;
      drone.x = Math.max(0, Math.min(100, drone.x));
      drone.y = Math.max(0, Math.min(100, drone.y));
    }

    if (!trails.has(drone.name)) trails.set(drone.name, []);
    const trail = trails.get(drone.name);
    trail.push({ x: drone.x, y: drone.y });
    if (trail.length > TRAIL_LENGTH) trail.shift();
  });

  checkAutoJam();
  redrawMap();

  updateStatusBar(
    drones.filter(d => d.side !== 'ally' && (d.mode === 'active' || d.mode === 'normal')).length,
    drones.filter(d => d.side !== 'ally' && d.mode === 'jammed').length,
    drones.filter(d => d.side !== 'ally' && d.mode === 'neutralized').length
  );
}

/* Drawing */
function drawGrid(w, h) {
  const cols = 10;
  const rows = 6;
  const cellW = w / cols;
  const cellH = h / rows;

  ctx.strokeStyle = '#063';
  ctx.lineWidth = 1;

  for (let c = 0; c <= cols; c++) {
    const x = c * cellW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  for (let r = 0; r <= rows; r++) {
    const y = r * cellH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.4, h * 0.3, w * 0.2, h * 0.4);
}

function redrawMap() {
  const w = map.width;
  const h = map.height;

  ctx.fillStyle = 'rgba(0, 10, 0, 1)';
  ctx.fillRect(0, 0, w, h);

  drawGrid(w, h);

  const toX = p => (p / 100) * w;
  const toY = p => (p / 100) * h;

  // Infrastructure
  infraMarkers.forEach(m => {
    const x = toX(m.x);
    const y = toY(m.y);

    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 2;

    if (m.type === 'critical') {
      ctx.strokeStyle = '#ff0';
      ctx.fillStyle = 'rgba(255,255,0,0.15)';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.strokeRect(-10, -10, 20, 20);
    } else if (m.type === 'mobile') {
      ctx.strokeStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(10, 10);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.stroke();
    } else if (m.type === 'land') {
      ctx.strokeStyle = '#0f0';
      ctx.strokeRect(-8, -8, 16, 16);
    } else if (m.type === 'sea') {
      ctx.strokeStyle = '#0af';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#0f0';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(m.label, 12, -8);

    ctx.restore();
  });

  // Drones
  drones.forEach(drone => {
    const status = decideDroneStatus(drone);
    const x = toX(drone.x);
    const y = toY(drone.y);

    const trail = trails.get(drone.name);
    if (trail && trail.length > 1) {
      ctx.strokeStyle = drone.side === 'ally'
        ? 'rgba(0,200,255,0.3)'
        : 'rgba(0,255,0,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      trail.forEach((p, i) => {
        const tx = toX(p.x);
        const ty = toY(p.y);
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      });
      ctx.stroke();
    }

    let color;
    let size = 4;

    if (drone.side === 'ally') {
      color = '#0cf';
      size = 5;
    } else if (drone.mode === 'jammed') {
      color = '#00f';
      size = 6;
    } else if (drone.mode === 'neutralized') {
      return;
    } else if (status.score >= 81) {
      color = '#f00';
      size = 7;
    } else if (status.score >= 61) {
      color = '#f80';
      size = 6;
    } else if (status.score >= 31) {
      color = '#aa0';
      size = 5;
    } else {
      color = '#0a0';
      size = 4;
    }

    if (drone.selected) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, size + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Accessible drone list
  let list = document.getElementById('droneList');
  if (!list) {
    list = document.createElement('div');
    list.id = 'droneList';
    list.setAttribute('aria-label', 'Current drones');
    list.setAttribute('role', 'list');
    map.insertAdjacentElement('afterend', list);
  }
  list.innerHTML = '';
  drones.forEach(drone => {
    if (drone.mode === 'neutralized') return;
    const status = decideDroneStatus(drone);
    const labelSide = drone.side === 'ally' ? 'ALLY' : 'HOSTILE';
    const item = document.createElement('div');
    item.setAttribute('role', 'listitem');
    item.style.cursor = 'pointer';
    item.textContent =
      (drone.selected ? '[SELECTED] ' : '') +
      `[${labelSide}] ` +
      `${drone.name} – ${status.score.toFixed(0)} (${status.reasons})`;
    item.onclick = () => selectDrone(drone);
    list.appendChild(item);
  });
}

/* Mouse selection */
map.onclick = e => {
  const rect = map.getBoundingClientRect();
  const xPct = ((e.clientX - rect.left) / rect.width) * 100;
  const yPct = ((e.clientY - rect.top) / rect.height) * 100;

  let closest = null;
  let minDist = Infinity;
  drones.forEach(d => {
    const dx = d.x - xPct;
    const dy = d.y - yPct;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5 && dist < minDist) {
      minDist = dist;
      closest = d;
    }
  });

  if (closest) selectDrone(closest);
};

/* Wiring */
calmBtn.onclick = startCalm;
attackBtn.onclick = startAttack;
resetBtn.onclick = resetSimulation;
allyAddBtn.onclick = addAllyDrone;

jamBtn.onclick = () => {
  jamAllDrones('Operator');
};

pauseBtn.onclick = () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
  pauseBtn.setAttribute(
    'aria-label',
    isPaused ? 'Resume simulation' : 'Pause simulation'
  );
  logEvent(isPaused ? 'Simulation paused.' : 'Simulation resumed.', 'info');
};

disruptModeLabel.onclick = cycleDisruptMode;

seAddBtn.onclick = addCustomDrone;
infAddBtn.onclick = addInfrastructureMarker;

clearLogBtn.onclick = () => (log.innerHTML = '');

logFilter.onchange = () => {
  const entries = log.querySelectorAll('.log-entry');
  entries.forEach(entry => {
    const type = entry.className;
    const f = logFilter.value;
    const show =
      f === 'all' ||
      type.includes(f);
    entry.style.display = show ? '' : 'none';
  });
};

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  updateWeights();
  startCalm();

  function loop() {
    if (!isPaused) updatePositions();
    requestAnimationFrame(loop);
  }
  loop();
});

