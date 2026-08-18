// ilcaCapsize.js

/**
 * Calculates the dynamic heeling forces, handles momentum smoothing,
 * sets the clinometer display angle, and checks for an over-rotation capsize event.
 * @param {string} pointOfSail - Current relative point of sail string
 * @param {number} windSpeed - Wind speed in knots
 * @param {object} controls - The active ILCA global data data object references
 * @returns {boolean} True if the boat capsized, false if safely upright
 */
export function calculateHeelAndCapsize(pointOfSail, windSpeed, controls) {
  // If the boat is already marked as capsized, clamp stats and exit immediately
  if (controls.capsized) {
    controls.heelAngle = 90;
    
    const windDirection = window.globalSimulationData?.windDirection || 0;
    const boatHeading = typeof controls.heading === 'number' ? controls.heading : 0;
    const relativeAngle = ((boatHeading - windDirection) + 540) % 360 - 180;
    const displayDirectionMultiplier = relativeAngle >= 0 ? 1 : -1;
    
    controls.clinometer = 90 * displayDirectionMultiplier;
    return true;
  }

  // Initialize safe numerical values
  if (typeof controls.heelAngle !== 'number' || isNaN(controls.heelAngle)) {
    controls.heelAngle = 0;
  }

  // --- INSULATED CAPSIZE AND HEEL CALCULATION ENGINE ---
  let windHeelFactor = 0.0;
  if (pointOfSail === "Close Hauled") windHeelFactor = 1.4;
  if (pointOfSail === "Close Reach") windHeelFactor = 1.6;
  if (pointOfSail === "Beam Reach") windHeelFactor = 1.9;  
  if (pointOfSail === "Broad Reach") windHeelFactor = 0.4; 
  if (pointOfSail === "Running") windHeelFactor = 0.1;

  // --- 🎯 FIXED: EXPONENTIAL TENSION MATH STRING SANITIZATION ---
  // If boomAngle is a string range description like "0-8", safely convert to raw number 8
  let sheet = 0;
  if (typeof controls.boomAngle === 'string' && controls.boomAngle.includes('-')) {
    const parts = controls.boomAngle.split('-');
    sheet = parseFloat(parts[parts.length - 1]) || 0;
  } else {
    sheet = parseFloat(controls.boomAngle) || 0;
  }
  
  const linearTension = Math.max(0.1, (90 - sheet) / 90);
  const sheetTensionFactor = Math.pow(linearTension, 1.5);

  // --- DAGGERBOARD PIVOT TEXT TRANSLATION ---
  let daggerboardLeverage = 1.0;
  if (controls.daggerboard === "Down" || controls.daggerboard === 2) {
    daggerboardLeverage = 1.20; 
  } else if (controls.daggerboard === "Up" || controls.daggerboard === -2) {
    daggerboardLeverage = 0.80; 
  } else {
    daggerboardLeverage = 1.00; 
  }

  // Sailor counter-weight stability multipliers
  let hikingEffort = 1.0; 
  if (controls.sailorPosition === "Hike Out" || controls.sailorPosition === "Hike Hard") {
    hikingEffort = 0.35; 
  } else if (controls.sailorPosition === "Mid Center" || controls.sailorPosition === "Mid Center") {
    hikingEffort = 1.15; // Added your "Mid Center" log name variant here for stability!
  } else if (controls.sailorPosition === "Aft") {
    hikingEffort = 1.45; 
  }

  // Calculate target heel angle
  const targetHeelAngle = windSpeed * windHeelFactor * sheetTensionFactor * hikingEffort * daggerboardLeverage * 2.1;
  
  if (pointOfSail === "In Irons") {
    controls.heelAngle += (0 - controls.heelAngle) * 0.3;
  } else {
    const maximumCalculatedAngle = Math.min(Math.max(targetHeelAngle, 0), 90);
    controls.heelAngle += (maximumCalculatedAngle - controls.heelAngle) * 0.6;
  }

  // --- BOAT HEADING PROTECTION ---
  const windDirection = window.globalSimulationData?.windDirection || 0; 
  const boatHeading = typeof controls.heading === 'number' ? controls.heading : 0;
  
  const relativeAngle = ((boatHeading - windDirection) + 540) % 360 - 180;
  const displayDirectionMultiplier = relativeAngle >= 0 ? 1 : -1;

  // STORE VALUE FOR UI GAUGE
  controls.clinometer = controls.heelAngle * displayDirectionMultiplier;

  // Evaluate absolute catastrophic rollover parameters
  if (controls.heelAngle >= 45) {
    controls.capsized = true;
    controls.heelAngle = 90;
    controls.clinometer = 90 * displayDirectionMultiplier;
    controls.speed = 0; 
    return true; 
  }

  return false; 
}
