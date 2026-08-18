// ilcaHandleControls.js
import { computeBearing } from "./ilcaUtils.js";

export function handleControls(windDir, windSpeed) {
  const ilca = window.globalSimulationData.ILCA;
  let currentHeading = ilca.heading;
  
  // --- TRACK OLD TACK STATE ---
  // Calculate which tack we are on BEFORE the steering maneuver
  const relativeAngleBefore = ((currentHeading - windDir + 540) % 360) - 180; 
  const isStarboardTackBefore = relativeAngleBefore >= 0;

  // A crisp 3-degree adjustment step prevents over-steering near the buoys
  const STEERING_STEP = 3; 

  switch (ilca.maneuver) {
    case "turn-port": {
      // Calculate a standard 45-degree turn left
      let targetHeading = (currentHeading - 45 + 360) % 360;
      
      // Check if this left turn would land the bow inside the "In Irons" no-go zone.
      // An ILCA stalls if it gets closer than 45° to the wind axis.
      const relativeAngleAfter = ((targetHeading - windDir + 540) % 360) - 180;
      
      if (Math.abs(relativeAngleAfter) < 45) {
        // ⛵ INTENTIONAL TACK COMPENSATOR: Instead of stalling in irons,
        // snap the boat perfectly to the opposite upwind Close Hauled tack (-45° from wind)
        ilca.heading = (windDir - 45 + 360) % 360;
        //console.log(`⛵ Port Turn forced a tack! Compensating to Port Close Hauled at ${ilca.heading}° to avoid In Irons.`);
      } else {
        ilca.heading = targetHeading;
      }
      break;
    }

    case "turn-starboard": {
      // Calculate a standard 45-degree turn right
      let targetHeading = (currentHeading + 45 + 360) % 360;
      
      // Check if this right turn would land the bow inside the "In Irons" no-go zone.
      const relativeAngleAfter = ((targetHeading - windDir + 540) % 360) - 180;
      
      if (Math.abs(relativeAngleAfter) < 45) {
        // ⛵ INTENTIONAL TACK COMPENSATOR: Instead of stalling in irons,
        // snap the boat perfectly to the opposite upwind Close Hauled tack (+45° from wind)
        ilca.heading = (windDir + 45) % 360;
        //console.log(`⛵ Starboard Turn forced a tack! Compensating to Starboard Close Hauled at ${ilca.heading}° to avoid In Irons.`);
      } else {
        ilca.heading = targetHeading;
      }
      break;
    }

    case "head-up":
      // ⛵ Head Up always steers the bow CLOSER to the wind axis
      if (isStarboardTackBefore) {
        ilca.heading = (currentHeading - STEERING_STEP + 360) % 360; // Turn left
      } else {
        ilca.heading = (currentHeading + STEERING_STEP + 360) % 360; // Turn right
      }
      break;

    case "bear-away": {
      // Check if the boat is currently trapped inside the 45-degree "In Irons" zone
      if (Math.abs(relativeAngleBefore) < 45) {
        // ⛵ IN IRONS ESCAPE VALVE: Force the boat's heading directly out to a working 
        // Close Hauled upwind alignment (45° off the wind) based on its current tack.
        if (isStarboardTackBefore) {
          ilca.heading = (windDir + 45) % 360; // Snap right out to Starboard Close Hauled
        } else {
          ilca.heading = (windDir - 45 + 360) % 360; // Snap left out to Port Close Hauled
        }
        //console.log(`⛵ Trapped In Irons! Bear away forced a clean recovery snap to Close Hauled at ${ilca.heading}°.`);
      } else {
        // ⛵ NORMAL OPERATION: Execute standard, smooth 3-degree adjustments when sailing freely
        if (isStarboardTackBefore) {
          ilca.heading = (currentHeading + STEERING_STEP + 360) % 360; // Turn right
        } else {
          ilca.heading = (currentHeading - STEERING_STEP + 360) % 360; // Turn left
        }
      }
      break;
    }
  }

  // --- TACK PENALTY EVALUATION LAYER ---
  // Calculate which tack we are on AFTER the steering maneuver completed
  const relativeAngleFinal = ((ilca.heading - windDir + 540) % 360) - 180;
  const isStarboardTackAfter = relativeAngleFinal >= 0;

  // If the tack state switched (e.g. Starboard to Port or Port to Starboard)
  if (isStarboardTackBefore !== isStarboardTackAfter) {
    
    // We must check if the crossing happened in front of the wind (a Tack) or behind it (a Jibe).
    // If the absolute average angle to the wind is less than 90°, it means the bow crossed the wind axis.
    const avgRelativeAngle = Math.abs((relativeAngleBefore + relativeAngleFinal) / 2);
    
    if (avgRelativeAngle < 90) {
      // ⛵ CRITICAL TACK PENALTY: Damping momentum as the sail passes through the eye of the wind.
      // Drops current speed by 35% instantly to simulate flapping sails and hull drag.
      const oldSpeed = ilca.speed || 0;
      ilca.speed = oldSpeed * 0.65;
      
      //console.log(`⛵ TACK DETECTED! Heading changed through the wind axis. Speed penalized from ${oldSpeed.toFixed(1)}kn to ${ilca.speed.toFixed(1)}kn.`);
    }
  }

  // Clear the maneuver state so it doesn't loop infinitely 
  // (Assuming your engine handles resets elsewhere, otherwise leave as is)
  ilca.maneuver = null; 
}


function angleDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
