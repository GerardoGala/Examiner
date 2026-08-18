// ilcaUpdateILCA.js
import { drawILCAOnMap } from "./ilcaMap.js";
import { handleControls } from "./ilcaHandleControls.js";


export function updateILCA(map) {
  const windDir = window.globalSimulationData.windDirection;
  const windSpeed = window.globalSimulationData.windSpeed;

  // 🏁 SAFETY CHECK
  if (window.globalSimulationData.raceFinished) {
    if (window.globalSimulationData.ILCA) window.globalSimulationData.ILCA.speed = 0;
//drawILCAOnMap(map);
    return; 
  }

  // Run controls and steering physics
  handleControls(windDir, windSpeed);
  const speedKnots = window.globalSimulationData.ILCA.speed || 0;

  // Update boat position step
  if (speedKnots > 0) {
    let lat = window.globalSimulationData.ILCA.lat;
    let lon = window.globalSimulationData.ILCA.lon;
    const speedMS = speedKnots * 0.5144;
    const distance = speedMS * 1; // 1-second step

    const headingRad = window.globalSimulationData.ILCA.heading * Math.PI / 180;
    const metersPerDegLat = 111320;
    const metersPerDegLon = 111320 * Math.cos(lat * Math.PI / 180);

    window.globalSimulationData.ILCA.lat = lat + ((distance * Math.cos(headingRad)) / metersPerDegLat);
    window.globalSimulationData.ILCA.lon = lon + ((distance * Math.sin(headingRad)) / metersPerDegLon);
  }



  // Redraw boat overlay on the webpage map
  //drawILCAOnMap(map);
}



