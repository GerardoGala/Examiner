// app.js
import { initMap, updateWindControl, updateILCAControl } from './map.js';
import { fetchWind } from './wind.js';
import { updateILCA } from './ilcaUpdateILCA.js';
import { applyControls } from './ilcaApplyControls.js'; 

let map;
let launched = false;
let masterIntervalId = null;

async function loadConfig() {
  map = initMap();

  // Fetch wind immediately so overlays show something
  await updateWindFromAPI();

  // Show initial status immediately
  updateWindControl(map);
  updateILCAControl();



  // --- Unified master loop (every 1 second) ---
  let tick = 0;
  masterIntervalId = setInterval(async () => {
    tick++;

    // Update ILCA physics if launched
    if (launched) {
      
      // ⏱️ TIMER STEP: Numerical seconds counter increments cleanly here
      window.globalSimulationData.ILCA.timer++;

      // --- Capsize Halting Check ---
      if (window.globalSimulationData.ILCA.capsized) {
        console.warn("Simulation stopped due to capsize.");
        
        // Hide warning bar and clear active loops
        const warningDiv = document.getElementById("heelWarningContainer");
        if (warningDiv) {
          warningDiv.style.display = "none";
          warningDiv.classList.remove("danger-shake");
        }

        alert("Boom! You capsized! Make sure to hike out or ease your sheet when the wind picks up. Wind is reset back to 7 knots.");
        window.globalSimulationData.windSpeed = 7;
        const windRadio = document.querySelector(
            'input[name="wind"][value="7"]'
        );

        if (windRadio) {
            windRadio.checked = true;
        }
        launchSimulation();
        return;
      }

      updateILCA(map);

      const windSpeed = Number(window.globalSimulationData.windSpeed) || 0;
      const windDir = window.globalSimulationData.windDirection;
      const heading = window.globalSimulationData.ILCA.heading;

      // --- Point of Sail ---
      const pointOfSail = getPointOfSail(windDir, heading);
      window.globalSimulationData.ILCA.pointOfSail = pointOfSail;  // <-- store it
      
      const controls = window.globalSimulationData.ILCA;
      const newSpeed = applyControls(pointOfSail, windSpeed, controls); // ◄ Calculated via imported function

      window.globalSimulationData.ILCA.speed = newSpeed;

      

    }


    // Refresh overlays
    updateWindControl(map);
    updateILCAControl();
   

    // --- Dynamic Cockpit Warning UI Management ---
    const ilcaData = window.globalSimulationData?.ILCA;
    const warningDiv = document.getElementById("heelWarningContainer");
    const heelDegSpan = document.getElementById("uiHeelDegrees");

    if (warningDiv && ilcaData) {
      // Show dashboard element if boat heels past 30 degrees (and isn't flipped yet)
      if (ilcaData.heelAngle >= 30 && !ilcaData.capsized && launched) {
        warningDiv.style.display = "block";
        if (heelDegSpan) {
          heelDegSpan.textContent = Math.round(ilcaData.heelAngle);
        }
        
        // Trigger intense shaking animation class if critically close to tipping over (38°+)
        if (ilcaData.heelAngle >= 38) {
          warningDiv.classList.add("danger-shake");
          warningDiv.style.background = "#fca5a5"; // Deepen panel to warning red
        } else {
          warningDiv.classList.remove("danger-shake");
          warningDiv.style.background = "#fee2e2"; // Keep default alert tint
        }
      } else {
        // Suppress warning layout safely if flat or out of simulation window parameters
        warningDiv.style.display = "none";
        warningDiv.classList.remove("danger-shake");
      }
    }
  }, 1000);
}


// --- Clean, flat helper to sync the wind state ---
async function updateWindFromAPI() {
  try {
    const windData = await fetchWind(); // Returns { direction, speed }
    if (windData) {
      window.globalSimulationData.windDirection = Number(windData.direction);
      window.globalSimulationData.windSpeed = Number(windData.speed);
      
      //console.log("Wind updated:", window.globalSimulationData.windDirection, window.globalSimulationData.windSpeed);
    }
  } catch (err) {
    console.error("Wind fetch failed:", err);
  }
}



// Launch simulation
export function launchSimulation() {
  launched = true;
  fetchWind();

  // Reset core simulation variables back to fresh upright conditions
  window.globalSimulationData.ILCA.capsized = false;
  window.globalSimulationData.ILCA.heelAngle = 0;


  window.globalSimulationData.ILCA.heading = 90;
  window.globalSimulationData.ILCA.speed = 0;

  window.globalSimulationData.ILCA.timer = 0;
}

// Stop simulation
export function stopSimulation() {
  launched = false;
  if (masterIntervalId) {
    clearInterval(masterIntervalId);
    masterIntervalId = null;
  }
}

window.launchSimulation = launchSimulation;


loadConfig();

function getPointOfSail(windDir, heading) {
  // Absolute difference between heading and wind direction
  let rel = Math.abs(heading - windDir) % 360;
  if (rel > 180) rel = 360 - rel; // fold into 0–180

  if (rel <= 44)  return "In Irons";       // Directly into the wind (0° - 45°)
  if (rel <= 60)  return "Close Hauled";   // Tightest angle to sail (45° - 60°)
  if (rel <= 80)  return "Close Reach";    // Heading slightly upwind (60° - 80°)
  if (rel <= 100) return "Beam Reach";     // Wind directly across the beam (80° - 100°)
  if (rel <= 150) return "Broad Reach";    // Wind coming from behind/side (100° - 150°)
  return "Running";                        // Sailing dead downwind (150° - 180°)
}
