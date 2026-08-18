// ilcaApplyControls.js
import { calculateHeelAndCapsize } from './ilcaCapsize.js';
import { getWindTier, SCENARIO_TARGETS } from './ilcaTargets.js';

/**
 * Calculates smooth linear reduction multipliers based on distance to targets.
 */
function getTrimMultiplier(currentValue, targetValue, penaltyWeight = 0.4) {
  const deviation = Math.abs(currentValue - targetValue);
  return Math.max(0.5, 1.05 - (deviation * penaltyWeight));
}

/**
 * Calculates a range multiplier so any boom angle inside the manual's specified 
 * windows (e.g., 35° to 65°) yields peak efficiency, penalized smoothly outside it.
 */
function getBoomRangeMultiplier(currentAngle, minAngle, maxAngle) {
  let deviation = 0;
  if (currentAngle < minAngle) {
    deviation = minAngle - currentAngle;
  } else if (currentAngle > maxAngle) {
    deviation = currentAngle - maxAngle;
  }
  return Math.max(0.5, 1.05 - ((deviation / 110) * 0.75));
}

export function applyControls(pointOfSail, windSpeed, controls) {
  // 🔬 DEBUG TRACER
  //console.log("PAYLOAD CHECK:", JSON.stringify(controls));

  // --- CAPSIZE CHECK ---
  if (controls.capsized) {
    controls.heelAngle = 90;
    return 0.0;
  }

  // --- SPECIAL CASE: IN IRONS ---
  if (pointOfSail === "In Irons") {
    controls.heelingForceMultiplier = 0.0;
    let currentClinometer = controls.clinometer || 0;
    controls.clinometer = currentClinometer + (0 - currentClinometer) * 0.6;
    return 0.0;
  }

  // Group reaching vectors under one conceptual manual header
  let lookupHeading = pointOfSail;
  if (pointOfSail.includes("Reach")) {
    lookupHeading = "Reaching";
  }

  // Define global base efficiencies based on direction heading
  let baseFactor = 0.5;
  if (pointOfSail === "Close Hauled") baseFactor = 0.7;
  if (pointOfSail === "Close Reach" || pointOfSail === "Broad Reach") baseFactor = 1.0;
  if (pointOfSail === "Beam Reach") baseFactor = 1.2;
  if (pointOfSail === "Running") baseFactor = 0.8;

  // --- FIXED: ROUNDED DECIMAL & SAFE FALLBACK TARGETS ---
  const roundedWindSpeed = Math.round(windSpeed || 0);
  const windTier = getWindTier(roundedWindSpeed) || "Moderate"; // ◄ Updated fallback to Moderate
  
  const safeHeading = SCENARIO_TARGETS[lookupHeading] ? lookupHeading : "Close Hauled";
  const targets = SCENARIO_TARGETS[safeHeading][windTier] || SCENARIO_TARGETS[safeHeading]["Moderate"]; // ◄ Updated fallback to Moderate

  let modifier = 1.0;

  // --- INTERFACE TRANSLATION LAYER ---
  const v = controls.vang;            
  const d = controls.downhaul;        
  const o = controls.outhaul;         
  const db = controls.daggerboard;    

  // 🎯 FIX: Convert a string range like "0-8" into a clean numeric value (8)
  let numericBoomAngle = 0;
  if (typeof controls.boomAngle === 'string' && controls.boomAngle.includes('-')) {
    const parts = controls.boomAngle.split('-');
    numericBoomAngle = parseFloat(parts[parts.length - 1]) || 0; // Extracts the high end number (8)
  } else {
    numericBoomAngle = parseFloat(controls.boomAngle) || 0;
  }

  // --- 1. BOOM ANGLE PENALTY ---
  modifier *= getBoomRangeMultiplier(numericBoomAngle, targets.minBoom, targets.maxBoom);

  // --- 2. SAIL RIG CONTROLS PENALTIES ---
  modifier *= (v === targets.vang) ? 1.0 : 0.85;
  modifier *= (d === targets.downhaul) ? 1.0 : 0.85;
  modifier *= (o === targets.outhaul) ? 1.0 : 0.85;

  // --- 3. SAILOR POSITION MATCHING ---
  if (controls.sailorPosition === targets.sailor) {
    modifier *= 1.08; 
  } else if (controls.sailorPosition === "Mid Center") {
    modifier *= 0.98;
  } else {
    modifier *= 0.88;
  }

  // --- 4. DAGGERBOARD PERFORMANCE & LEEWAY TRACKING ---
  if (db === targets.daggerboard) {
    modifier *= 1.05; 
  } else {
    modifier *= 0.90; 
  }

  if (lookupHeading === "Close Hauled") {
    if (db === "Down") controls.leeway = 2.0;
    else if (db === "Center") controls.leeway = 15.0;
    else controls.leeway = 35.0; 
  } else if (lookupHeading === "Reaching") {
    if (db === "Center") controls.leeway = 3.0;
    else controls.leeway = 11.0; 
  } else {
    if (db === "Up") controls.leeway = 1.0;
    else if (db === "Center") controls.leeway = 3.0;
    else controls.leeway = 5.0; 
  }

  // --- 5. HEEL SPILLING LOGIC ---
  if (numericBoomAngle > targets.maxBoom) {
    const easeDeg = numericBoomAngle - targets.maxBoom;
    controls.heelingForceMultiplier = Math.max(0.0, 1.0 - (easeDeg / 45.0));
  } else {
    controls.heelingForceMultiplier = 1.0;
  }

  // --- FINAL Physics PASS LINK ---
  // Pass the wind speed and let the physics processor calculate tilt mechanics
  const isCapsized = calculateHeelAndCapsize(pointOfSail, windSpeed, controls);
  if (isCapsized) {
    return 0.0;
  }

  const finalSpeedFactor = baseFactor * modifier;
  return Math.min(windSpeed * finalSpeedFactor, 12);
}
