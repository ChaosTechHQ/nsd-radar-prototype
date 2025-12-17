// NSD radar scenarios: calm and attack

const calmDrones = [
  {
    name: "Drone A",
    x: 15,
    y: 20,
    speed: 0.3,
    heading: 40,
    rfStrength: 20,
    distance: 120,
    mode: "normal"
  },
  {
    name: "Drone B",
    x: 70,
    y: 60,
    speed: 0.2,
    heading: 200,
    rfStrength: 30,
    distance: 150,
    mode: "normal"
  },
  {
    name: "Drone C",
    x: 30,
    y: 80,
    speed: 0.25,
    heading: 320,
    rfStrength: 25,
    distance: 100,
    mode: "normal"
  }
];

const attackDrones = [
  {
    name: "Attacker 1",
    x: 10,
    y: 10,
    speed: 0.9,
    heading: 45,
    rfStrength: 90,
    distance: 40,
    mode: "normal"
  },
  {
    name: "Attacker 2",
    x: 20,
    y: 20,
    speed: 0.8,
    heading: 60,
    rfStrength: 85,
    distance: 35,
    mode: "normal"
  },
  {
    name: "Attacker 3",
    x: 80,
    y: 20,
    speed: 0.8,
    heading: 120,
    rfStrength: 95,
    distance: 30,
    mode: "normal"
  },
  {
    name: "Support 1",
    x: 85,
    y: 75,
    speed: 0.4,
    heading: 200,
    rfStrength: 60,
    distance: 80,
    mode: "normal"
  }
];

function cloneScenario(scenario) {
  return JSON.parse(JSON.stringify(scenario));
}
