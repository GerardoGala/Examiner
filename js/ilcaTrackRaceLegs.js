// ilcaTraceRaceLegs.js

// --- CONFIGURATION CONSTANTS ---
// Change this single number to adjust how close the boat needs to get to trigger an auto-tack.
const ROUNDING_RADIUS_METERS = 10;

// Main leg manager execution block
export function trackRaceLegs(map) {
  const ilcaLat = window.globalSimulationData.ILCA.lat;
  const ilcaLon = window.globalSimulationData.ILCA.lon;

  // Remove roundingRadius from here since we use the constant above
  let targetLat, targetLon, targetName;
  
  let triggerRedirect = false;
  let finalTimeScore = 0;
  let finalWindSpeed = 0;

  // --- 1. TARGET ROUTING SYSTEM ---
  switch (window.globalSimulationData.currentLeg) {
    case 0:
      targetLat = window.globalSimulationData.windwardMarkLat;
      targetLon = window.globalSimulationData.windwardMarkLon;
      targetName = "Windward Mark";
      break;
    case 1:
      targetLat = window.globalSimulationData.gybeMarkLat;
      targetLon = window.globalSimulationData.gybeMarkLon;
      targetName = "Gybe Mark";
      break;
    case 2:
      targetLat = window.globalSimulationData.leewardMarkLat;
      targetLon = window.globalSimulationData.leewardMarkLon;
      targetName = "Leeward Mark"; 
      break;
    case 3:
      targetLat = window.globalSimulationData.windwardMarkLat;
      targetLon = window.globalSimulationData.windwardMarkLon;
      targetName = "Windward Mark";
      break;
    case 4:
      targetLat = window.globalSimulationData.leewardMarkLat;
      targetLon = window.globalSimulationData.leewardMarkLon;
      targetName = "Leeward Mark (Finish Line)";
      break;
    default:
      return; 
  }

  const distanceToTarget = calculateDistance(ilcaLat, ilcaLon, targetLat, targetLon);

  // --- 🛰️ FIXED TELEMETRY PASS: CRITICAL MATCH ---
  window.globalSimulationData.distToMark = distanceToTarget;
  window.globalSimulationData.bearingToMark = calculateHeadingToTarget(ilcaLat, ilcaLon, targetLat, targetLon);

  // --- 🛰️ FINAL TELEMETRY PIPELINE PATH SYNC ---
  window.globalSimulationData.ILCA.distanceToBuoy = distanceToTarget;
  window.globalSimulationData.ILCA.bearingToBuoy = window.globalSimulationData.bearingToMark;

  if (!window.globalSimulationData.telemetryHistory) {
    window.globalSimulationData.telemetryHistory = [];
  }

  window.globalSimulationData.telemetryHistory.push({
    timestamp: window.globalSimulationData.ILCA.timer || 0,
    leg: window.globalSimulationData.currentLeg,
    distToMark: distanceToTarget,
    bearingToMark: window.globalSimulationData.bearingToMark,
    heading: window.globalSimulationData.ILCA.heading || 0,
    speed: window.globalSimulationData.ILCA.speed || 0
  });


  // --- 2. TRIGGER ON ARRIVAL ---
  if (distanceToTarget <= ROUNDING_RADIUS_METERS) {
    if (typeof showNotification === "function") {
      showNotification("ILCA rounded the buoy!");
    }

    // --- AUTOMATIC TACK / JIBE SYSTEM ---
    if (window.globalSimulationData.ILCA && window.globalSimulationData.ILCA.tack !== undefined) {
      switch (window.globalSimulationData.currentLeg) {
        case 0: window.globalSimulationData.ILCA.tack = "Starboard"; break;
        case 1: window.globalSimulationData.ILCA.tack = "Port"; break;
        case 2: window.globalSimulationData.ILCA.tack = "Starboard"; break;
        case 3: window.globalSimulationData.ILCA.tack = "Port"; break;
      }

      eventNotification(`Auto-rounded: Boat stabilized on ${window.globalSimulationData.ILCA.tack} Tack.`);

    }

    // --- 3. STATE MACHINE FOR MARK ROUNDINGS & AUTO-STEERING ---
    let nextMarkLat, nextMarkLon;

    switch (window.globalSimulationData.currentLeg) {
      case 0:
        window.globalSimulationData.windwardMarkRounded = 1;
        window.globalSimulationData.currentLeg = 1; 
        nextMarkLat = window.globalSimulationData.gybeMarkLat;
        nextMarkLon = window.globalSimulationData.gybeMarkLon;
        if (window.globalSimulationData.activeMarker) window.globalSimulationData.activeMarker.setLatLng([nextMarkLat, nextMarkLon]);
        break;
      case 1:
        window.globalSimulationData.gybeMarkRounded = 1;
        window.globalSimulationData.currentLeg = 2; 
        nextMarkLat = window.globalSimulationData.leewardMarkLat;
        nextMarkLon = window.globalSimulationData.leewardMarkLon;
        if (window.globalSimulationData.activeMarker) window.globalSimulationData.activeMarker.setLatLng([nextMarkLat, nextMarkLon]);
        break;
      case 2:
        window.globalSimulationData.leewardMarkRounded = 1;
        window.globalSimulationData.currentLeg = 3; 
        nextMarkLat = window.globalSimulationData.windwardMarkLat;
        nextMarkLon = window.globalSimulationData.windwardMarkLon;
        eventNotification("Leeward Mark passed. Starting Leg 4 Upwind Beat!");
        if (window.globalSimulationData.activeMarker) window.globalSimulationData.activeMarker.setLatLng([nextMarkLat, nextMarkLon]);
        break;
      case 3:
        window.globalSimulationData.windwardMarkRounded = 2;
        window.globalSimulationData.currentLeg = 4; 
        nextMarkLat = window.globalSimulationData.leewardMarkLat;
        nextMarkLon = window.globalSimulationData.leewardMarkLon;
        eventNotification("Windward Mark rounded a second time! Bear away into final downwind Run!");
        if (window.globalSimulationData.activeMarker) window.globalSimulationData.activeMarker.setLatLng([nextMarkLat, nextMarkLon]);
        break;
      case 4:
        window.globalSimulationData.raceFinished = true;
        window.globalSimulationData.leewardMarkRounded = 2; 
        if (window.globalSimulationData.activeMarker) window.globalSimulationData.activeMarker.remove();
        finalTimeScore = window.globalSimulationData.ILCA.timer || 0;
        finalWindSpeed = Number(window.globalSimulationData.windSpeed) || 0;
        triggerRedirect = true;
        eventNotification("Race Completed! Final dead downwind finish registered.");
        break;
    }

    // --- AUTO-STEER HEADING GENERATOR ---
    if (nextMarkLat !== undefined && nextMarkLon !== undefined && window.globalSimulationData.ILCA) {
      let newHeading = calculateHeadingToTarget(ilcaLat, ilcaLon, nextMarkLat, nextMarkLon);
      
      // ⛵ LEG 3 UPWIND NO-GO ZONE INTERCEPTOR
      if (window.globalSimulationData.currentLeg === 3) {
        const windDir = window.globalSimulationData.windDirection || 0;
        const relativeAngleToWind = ((newHeading - windDir + 540) % 360) - 180;
        
        // If the calculated path to the next mark would trap the auto-pilot inside irons (< 45°)
        if (Math.abs(relativeAngleToWind) < 45) {
          const currentTack = window.globalSimulationData.ILCA.tack || "Starboard";
          newHeading = currentTack === "Starboard" ? (windDir + 45) % 360 : (windDir - 45 + 360) % 360;
          
          eventNotification(`Auto-Pilot: Avoided irons on Leg 3! Adjusted upwind heading to ${newHeading.toFixed(0)}° on ${currentTack}.`);
        }
      }

      window.globalSimulationData.ILCA.heading = newHeading;
      eventNotification(`Auto-Pilot: Course adjusted to ${newHeading.toFixed(0)}°.`);
    }
  } else {
    const alertBox = document.getElementById("nearBuoy");
    if (alertBox) {
      if (distanceToTarget > ROUNDING_RADIUS_METERS && distanceToTarget < 25) {
        alertBox.innerText = `Approaching ${targetName} (${distanceToTarget.toFixed(0)}m)`;
        alertBox.style.display = "block";
      } else {
        alertBox.style.display = "none";
      }
    }
  }

  // --- 4. REDIRECTION & DIALOG INTERCEPTOR ---
  if (triggerRedirect) {
    // 🎯 FIXED: Completely removed window.showFinishDialog() to banish the first screen forever!
    // The tracker now instantly forwards the browser straight to your beautiful finish.html dashboard.
    
    // We pass a default 'top10=false' here because your fresh finish.html now runs its own independent 
    // cloud database checks the moment a player clicks the Close button anyway!
    window.location.href = `finish.html?time=${finalTimeScore}&wind=${finalWindSpeed}&top10=false&askedAI=${window.globalSimulationData.askedAI === true}`;
  }
}


// --- LOCAL MATH ENGINE MODULE ---
function calculateDistance(lat1, lon1, lat2, lon2) {
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos(lat1 * Math.PI / 180);
  const dLat = (lat1 - lat2) * metersPerDegLat;
  const dLon = (lon1 - lon2) * metersPerDegLon;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function calculateHeadingToTarget(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
