// NSD drone brain with weight-based threat score
function decideDroneStatus(drone, weights) {
  const w = weights || { rf: 1.0, center: 1.0, speed: 1.0 };

  const dx = drone.x - 50;
  const dy = drone.y - 50;
  const radialDistance = Math.sqrt(dx * dx + dy * dy);

  let score = 0;
  let reasons = [];

  if (drone.rfStrength > 80) {
    score += 40 * w.rf;
    reasons.push("strong RF");
  } else if (drone.rfStrength > 50) {
    score += 20 * w.rf;
    reasons.push("medium RF");
  }

  if (radialDistance < 20) {
    score += 30 * w.center;
    reasons.push("inside inner ring");
  } else if (radialDistance < 40) {
    score += 15 * w.center;
    reasons.push("near center");
  }

  if (drone.speed > 20) {
    score += 30 * w.speed;
    reasons.push("super fast");
  } else if (drone.speed > 10) {
    score += 15 * w.speed;
    reasons.push("fast");
  }

  if (drone.distance !== undefined && drone.distance < 50 && drone.speed > 10) {
    score += 10;
    reasons.push("close & fast");
  }

  if (score > 100) score = 100;

  let status;
  if (score >= 70) status = "HIGH THREAT";
  else if (score >= 40) status = "MEDIUM THREAT";
  else if (score >= 10) status = "LOW THREAT";
  else status = "SAFE";

  return {
    status,
    score: Math.round(score),
    reason: reasons.length > 0 ? reasons.join(", ") : "no major factors"
  };
}
