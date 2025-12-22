// NSD Field Scenarios: calm, attack, and allied drones

const calmDrones = [
  { name: 'Patrol A', x: 10, y: 20, speed: 8, heading: 45,  rfStrength: 25, mode: 'normal', side: 'enemy' },
  { name: 'Patrol B', x: 70, y: 15, speed: 6, heading: 190, rfStrength: 20, mode: 'normal', side: 'enemy' },
  { name: 'Patrol C', x: 25, y: 70, speed: 7, heading: 135, rfStrength: 30, mode: 'normal', side: 'enemy' }
];

const attackDrones = [
  { name: 'Swarm 1', x: 0,   y: 30, speed: 12, heading: 15,  rfStrength: 90, mode: 'active', side: 'enemy' },
  { name: 'Swarm 2', x: 0,   y: 50, speed: 10, heading: 10,  rfStrength: 85, mode: 'active', side: 'enemy' },
  { name: 'Swarm 3', x: 0,   y: 70, speed: 11, heading: 5,   rfStrength: 80, mode: 'active', side: 'enemy' },
  { name: 'Swarm 4', x: 100, y: 40, speed: 9,  heading: 195, rfStrength: 75, mode: 'active', side: 'enemy' }
];

// Allied drones (never jammed, blue)
const alliedDrones = [
  { name: 'Ally 1', x: 20, y: 40, speed: 6, heading: 0,   rfStrength: 40, mode: 'ally', side: 'ally' },
  { name: 'Ally 2', x: 80, y: 30, speed: 8, heading: 180, rfStrength: 45, mode: 'ally', side: 'ally' }
];

// Mutable collection used at runtime (defaults + user-added)
let runtimeAlliedDrones = alliedDrones.map(cloneScenario);


function cloneScenario(obj) {
  return JSON.parse(JSON.stringify(obj));
}

