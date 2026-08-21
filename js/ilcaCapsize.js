// ilcaCapsize.js

/**
 * Calculates the dynamic heeling forces, handles momentum smoothing,
 * sets the clinometer display angle, and checks for an over-rotation capsize event.
 * Fully optimized to capture wind speed parameters from both arguments and global data state trees.
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

  // 👉 BUG RECOVERY: Fallback check to capture wind speed if the parameter argument is empty/incorrect
  let activeWindSpeed = typeof windSpeed === 'number' ? windSpeed : 0;
  if (activeWindSpeed === 0 && controls && typeof controls.windSpeed === 'number') {
    activeWindSpeed = controls.windSpeed;
  }
  if (activeWindSpeed === 0 && window.globalSimulationData && typeof window.globalSimulationData.windSpeed === 'number') {
    activeWindSpeed = window.globalSimulationData.windSpeed;
  }
  // Default fallback to your standard testing speed if all else fails
  if (activeWindSpeed === 0) activeWindSpeed = 15;

  // Normalize Point of Sail safely to handle outputs from your getPointOfSail() function ("Running")
  const normalizedPOS = typeof pointOfSail === 'string' ? pointOfSail.toLowerCase().trim() : '';

  // --- INSULATED CAPSIZE AND HEEL CALCULATION ENGINE ---
  let windHeelFactor = 0.0;
  if (normalizedPOS === "close wrapped" || normalizedPOS === "close hauled") windHeelFactor = 1.4;
  if (normalizedPOS === "close reach") windHeelFactor = 1.6;
  if (normalizedPOS === "beam reach") windHeelFactor = 1.9;  
  if (normalizedPOS === "broad reach") windHeelFactor = 0.4; 
  if (normalizedPOS === "running" || normalizedPOS === "run") windHeelFactor = 0.1;

  // --- 🎯 EXPONENTIAL TENSION MATH STRING SANITIZATION ---
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

  // Normalize Sailor Position to avoid any casing text matching bugs
  const normalizedPosition = typeof controls.sailorPosition === 'string' ? controls.sailorPosition.toLowerCase().trim() : '';

  // Sailor counter-weight stability multipliers
  let hikingEffort = 1.0; 
  if (normalizedPosition === "hike hard") {
    hikingEffort = 0.35; 
  } else if (normalizedPosition === "mid center") {
    hikingEffort = 1.15; 
  } else if (normalizedPosition === "aft") {
    hikingEffort = 1.45; 
  }

  // Calculate target heel angle
  let targetHeelAngle = activeWindSpeed * windHeelFactor * sheetTensionFactor * hikingEffort * daggerboardLeverage * 2.1;
  
  // --- ⛵ DEATH ROLL PHYSICS SIMULATION ENGINE ---
  let isDeathRolling = false;
  let deathRollHeel = 0;

  // Triggers downwind at 15 knots (Using the robust activeWindSpeed scanner variable)
  if ((normalizedPOS === "running" || normalizedPOS === "run") && activeWindSpeed >= 12) {
    
    // Weight placement modifier (Aft protects, anything else triggers danger)
    let weightModifier = 1.0;
    if (normalizedPosition === "aft") {
      weightModifier = 0.2; // Safe profile
    } else if (normalizedPosition === "mid center") {
      weightModifier = 1.2; // Unstable configuration
    } else {
      weightModifier = 1.6; // High danger (Forward/Leeward)
    }

    const rollRiskIndex = weightModifier;

    // Triggers oscillating physics if position is NOT Aft
    if (rollRiskIndex > 0.5) {
      isDeathRolling = true;
      
      const timestamp = Date.now() / 1000;
      const oscillationFrequency = 2.2; // Quickened up wobble velocity feel
      const oscillationAmplitude = rollRiskIndex * 28; // Extends calculations out past 45 degrees
      const windwardBias = -14 * rollRiskIndex; // Strong windward torque drop pull
      
      deathRollHeel = windwardBias + (Math.sin(timestamp * oscillationFrequency * Math.PI) * oscillationAmplitude);
    }
  }

  // Apply tracking states back down to the telemetry engine objects
  if (normalizedPOS === "in irons") {
    controls.heelAngle += (0 - controls.heelAngle) * 0.3;
  } else if (isDeathRolling) {
    // Sharp responsiveness adjustment for aggressive death roll oscillations
    controls.heelAngle += (deathRollHeel - controls.heelAngle) * 0.8;
  } else {
    // Safe limits protection clamping layer
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

  // Evaluate absolute catastrophic rollover parameters (Handles windward and leeward capsizes)
  if (Math.abs(controls.heelAngle) >= 45) {
    controls.capsized = true;

    const capsizeDirection = controls.heelAngle >= 0 ? 1 : -1;
    controls.heelAngle = 90 * capsizeDirection;
    controls.clinometer = 90 * displayDirectionMultiplier * capsizeDirection;
    controls.speed = 0; 
    return true; 
  }

  return false; 
}
