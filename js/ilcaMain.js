// ilcaMain.js
import { handleControls } from "./ilcaHandleControls.js";
import { updateILCA } from "./ilcaUpdateILCA.js";

// Calculate ILCA speed based on wind speed and beam reach assumption
export function calculateILCASpeed(windKnots) {
  const efficiency = 0.5;
  const baseSpeed = windKnots * efficiency;
  return Math.min(Math.max(baseSpeed, 0), 12);
}

// =========================================================================
// ⚓ RACE MATH UTILITIES (Exported for global cleanliness)
// =========================================================================

export function calculateHeadingToTarget(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos(lat1 * Math.PI / 180);
  const dLat = (lat1 - lat2) * metersPerDegLat;
  const dLon = (lon1 - lon2) * metersPerDegLon;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}
