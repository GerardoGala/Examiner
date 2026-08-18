// map.js
let windControlDiv; // keep reference so we can update later
let ilcaControlDiv; // keep reference so we can update later
let vmgControlDiv; // keep reference so we can update later

// Helper function to format raw seconds into MM:SS format
function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function initMap() {
  const leewardMarkLat = 13.670464;
  const leewardMarkLon = 121.401286;
  const windwardMarkLat = 13.67136786;
  const windwardMarkLon = 121.401286;


  const buoySVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="yellow" stroke="orange" stroke-width="4"/>
      <circle cx="24" cy="24" r="8" fill="orange" opacity="0.6"/>
    </svg>
  `;

  const buoyIcon = L.icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(buoySVG),
    iconSize: [20, 20],
    iconAnchor: [10, 10], // Adjusted anchor point to center the 20x20 marker over 
    popupAnchor: [0, -10]
  });







  const map = L.map('map', {
    center: [windwardMarkLat, windwardMarkLon],
    zoom: 16,
    dragging: false,        
    zoomControl: false,     
    scrollWheelZoom: false, 
    doubleClickZoom: false, 
    touchZoom: false        
  });

  // --- Add the 2 Marks to the Map ---
  const windwardMarker = L.marker([windwardMarkLat, windwardMarkLon], { icon: buoyIcon })
    .addTo(map);

  const leewardMarker = L.marker([leewardMarkLat, leewardMarkLon], { icon: buoyIcon })
    .addTo(map);




  // Add scale control to show distances on the map
  L.control.scale({
    position: 'bottomleft', 
    imperial: false,        
    metric: true            
  }).addTo(map);

  // --- topleft ---
  const TopLeftControls = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function(map) {
      const container = L.DomUtil.create('div', 'top-left-controls-container');
      
      // Stop map click/scroll events from bleeding through the panel
      L.DomEvent.disableClickPropagation(container);

      // Wind Indicator
      windControlDiv = L.DomUtil.create('div', 'wind-indicator-container', container);
      windControlDiv.style.background = 'white';
      windControlDiv.style.padding = '8px';
      windControlDiv.style.borderRadius = '5px';
      windControlDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
      windControlDiv.style.textAlign = 'center';
      windControlDiv.style.fontFamily = 'sans-serif';
      windControlDiv.style.fontSize = '12px';
      windControlDiv.style.fontWeight = 'bold';
      windControlDiv.style.color = '#222';
      windControlDiv.style.marginBottom = '8px'; // Adds vertical spacing between panels
      updateWindControl(map);

      // --- ILCA Status + Time ---
      ilcaControlDiv = L.DomUtil.create('div', 'ilca-status-container', container);
      ilcaControlDiv.style.background = 'white';
      ilcaControlDiv.style.padding = '8px';
      ilcaControlDiv.style.borderRadius = '5px';
      ilcaControlDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
      ilcaControlDiv.style.textAlign = 'center';
      ilcaControlDiv.style.fontFamily = 'sans-serif';
      ilcaControlDiv.style.fontSize = '12px';
      ilcaControlDiv.style.lineHeight = '1.4em';
      ilcaControlDiv.style.color = '#222';
      ilcaControlDiv.style.fontWeight = 'bold'; 
      updateILCAControl(map);

      // --- VMG Status ---
      vmgControlDiv = L.DomUtil.create('div', 'vmg-status-container', container);
      vmgControlDiv.style.background = 'white';
      vmgControlDiv.style.padding = '8px';
      vmgControlDiv.style.borderRadius = '5px';
      vmgControlDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
      vmgControlDiv.style.textAlign = 'center';
      vmgControlDiv.style.fontFamily = 'sans-serif';
      vmgControlDiv.style.fontSize = '12px';
      vmgControlDiv.style.lineHeight = '1.4em';
      vmgControlDiv.style.color = '#222';
      vmgControlDiv.style.fontWeight = 'bold'; 
      updateVMGControl();

      return container;
    }
  });

  // Render custom control group onto the UI
  map.addControl(new TopLeftControls());

  // Define bounds safely encompassing all three active race marks
  const bounds = L.latLngBounds([
    [windwardMarkLat, windwardMarkLon],
  
    [leewardMarkLat, leewardMarkLon]
  ]);
  map.fitBounds(bounds, { padding: [50, 50] });

  return map;
}

// --- Refresh function to update wind arrow dynamically ---
export function updateWindControl(map) {
  if (!windControlDiv) return;

  const windDir = window.globalSimulationData.windDirection || 0;
  const windSpeed = Number(window.globalSimulationData.windSpeed)?.toFixed(1) || "0.0";
  windControlDiv.innerHTML = `
    <div style="margin-bottom: 4px;">WIND</div>
    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
      <circle cx="25" cy="25" r="22" fill="none" stroke="#ccc" stroke-width="2"/>
      <text x="25" y="10" font-size="8" text-anchor="middle" fill="#666">N</text>
      <g transform="rotate(${windDir}, 25, 25)">
        <line x1="25" y1="5" x2="25" y2="40" stroke="blue" stroke-width="3" stroke-linecap="round"/>
        <polygon points="25,45 20,35 30,35" fill="blue" />
      </g>
    </svg>
    <div style="margin-top: 4px; color: blue;">
      ${windDir}° at ${windSpeed} kn
    </div>
  `;
}


// --- Refresh function to update ILCA status + time ---
export function updateILCAControl() {
  if (!ilcaControlDiv) return;
  if (window.globalSimulationData.raceFinished) return; 

  const ilca = window.globalSimulationData.ILCA || {};
  const speedKnots = ilca.speed?.toFixed(1) || 0;
  const speedMS = (ilca.speed ? (ilca.speed * 0.514).toFixed(2) : "0.00");
  const heading = ilca.heading?.toFixed(0) || 0;
  const pointOfSail = ilca.pointOfSail || "Unknown";
  
  // ✅ CALCULATED DISPLAY: Convert the raw numerical timer to MM:SS string here
  const timer = formatTime(ilca.timer);
 
  // ✅ PURE DISPLAY: Fetch values directly from the stored simulation object
  const uiRotation = ilca.clinometer || 0;
  const absoluteHeel = Math.abs(uiRotation);

  // Set visual alert gauge color thresholds purely from raw values
  let needleColor = "#38bdf8"; // Safe Blue Zone
  if (absoluteHeel >= 38) {
    needleColor = "#ef4444";   // Danger Red Zone
  } else if (absoluteHeel >= 25) {
    needleColor = "#f59e0b";   // Caution Orange Zone
  }

  ilcaControlDiv.innerHTML = `
    <div><strong>ILCA Status</strong></div>
    <svg xmlns="http://w3.org" width="50" height="50" viewBox="0 0 50 50" style="margin:4px 0;">
      <circle cx="25" cy="25" r="22" fill="none" stroke="#ccc" stroke-width="2"/>
      <text x="25" y="10" font-size="8" text-anchor="middle" fill="#666">N</text>
      <g transform="rotate(${Number(heading)}, 25, 25)">
        <line x1="25" y1="45" x2="25" y2="10" stroke="red" stroke-width="3" stroke-linecap="round"/>
        <polygon points="25,5 20,15 30,15" fill="red" />
      </g>
    </svg>
    <div>Heading: ${heading}°</div>
    <div>Point of Sail: ${pointOfSail}</div>
    <div>Speed: ${speedKnots} knots (${speedMS} m/s)</div>
    <div>Timer: ${timer}</div>

<!-- --- PURE VIEW RETRO CLINOMETER DISPLAY --- -->
<div id="clinometerBox" style="background: #ffffff; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; margin-top: 8px; text-align: center; color: #1e293b; font-family: sans-serif;">
    <div style="font-size: 11px; letter-spacing: 0.5px; color: #475569; font-weight: bold; margin-bottom: 6px; font-family: sans-serif;">HEEL CLINOMETER</div>
    
    <div style="position: relative; width: 100px; height: 50px; border: 1px solid #cbd5e1; border-radius: 50px 50px 0 0; background: #f8fafc; margin: 0 auto; overflow: hidden;">
        <div style="position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); width: 100%; text-align: center; font-size: 8px; color: #94a3b8; bottom: 1px;">
            45° [ 0° ] 45°
        </div>

        <!-- Needle transforms react strictly to pre-calculated state variables -->
        <div style="position: absolute; left: 50%; bottom: 0; width: 2px; height: 42px; background: ${needleColor}; transform-origin: bottom center; transform: translateX(-50%) rotate(${uiRotation}deg); transition: transform 0.2s ease-out;">
            <div style="position: absolute; top: 0; left: -2px; width: 6px; height: 6px; background: #ef4444; border-radius: 50%;"></div>
        </div>
    </div>

    <div style="margin-top: 6px; font-size: 12px; font-weight: bold; color: #000000;">
        Angle: <span style="color: ${needleColor};">${Math.round(absoluteHeel)}°</span>
    </div>
</div>

  `;
}



// --- Refresh function to update VMG ruler dynamically ---
export function updateVMGControl() {
  if (!vmgControlDiv) return;

  // 🏁 Freeze HUD when the race finishes
  if (window.globalSimulationData.raceFinished) return; 

  const ilca = window.globalSimulationData.ILCA || {};
  const currentLeg = window.globalSimulationData.currentLeg || 0;
  
  // Access the true wind direction from your global simulator data model
  const windDir = window.globalSimulationData.windDirection || 0; 

  // 1. Determine active target mark destination metrics based on the current race leg
  let destLat, destLon, currentMarkLabel;

  // --- UPDATED FOR 5-LEG SEQUENCE ---
  if (currentLeg === 0) {
    destLat = window.globalSimulationData.windwardMarkLat;
    destLon = window.globalSimulationData.windwardMarkLon;
    currentMarkLabel = "Windward Mark";
  } else if (currentLeg === 1) {
    destLat = window.globalSimulationData.gybeMarkLat;
    destLon = window.globalSimulationData.gybeMarkLon;
    currentMarkLabel = "Gybe Mark";
  } else if (currentLeg === 2) {
    destLat = window.globalSimulationData.leewardMarkLat;
    destLon = window.globalSimulationData.leewardMarkLon;
    currentMarkLabel = "Leeward Mark";
  } else if (currentLeg === 3) {
    destLat = window.globalSimulationData.windwardMarkLat;
    destLon = window.globalSimulationData.windwardMarkLon;
    currentMarkLabel = "Windward Mark";
  } else if (currentLeg === 4) {
    // Leg 5: Head back down to the Leeward Mark to finish the race
    destLat = window.globalSimulationData.leewardMarkLat;
    destLon = window.globalSimulationData.leewardMarkLon;
    currentMarkLabel = "Leeward Mark (Finish Line)";
  } else {
    return;
  }

  // 2. Fetch current real-time boat location coordinates
  const boatLat = ilca.lat || 0;
  const boatLon = ilca.lon || 0;
  const heading = ilca.heading || 0;
  const speedKnots = ilca.speed || 0;
  const speedMS = speedKnots * 0.5144; // Convert knots to m/s for HUD metric matching

  // 3. Compute bearing to active target coordinate point (For HUD navigation only)
  const dLon = (destLon - boatLon) * Math.PI / 180;
  const lat1 = boatLat * Math.PI / 180;
  const lat2 = destLat * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let bearingDest = Math.atan2(y, x) * 180 / Math.PI;
  if (bearingDest < 0) bearingDest += 360;

  // 4. Compute physical remaining distance in meters
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos(boatLat * Math.PI / 180);
  const deltaLatMeters = (boatLat - destLat) * metersPerDegLat;
  const deltaLonMeters = (boatLon - destLon) * metersPerDegLon;
  const distanceToTarget = Math.sqrt(deltaLatMeters * deltaLatMeters + deltaLonMeters * deltaLonMeters);

  // 5. Calculate VMG relative to True Wind Direction (TWD) axis
  const trueWindAngle = (heading - windDir) * Math.PI / 180;
  let vmgMS = 0;

  // --- FIX: Group upwind legs vs downwind/reaching legs correctly ---
  if (currentLeg === 0 || currentLeg === 3) {
    // Upwind Legs (Leg 1 & Leg 4): Progress made directly into the wind vector axis (dead upwind)
    vmgMS = speedMS * Math.cos(trueWindAngle);
  } else {
    // Downwind / Reaching Legs (Leg 2, Leg 3 & Leg 5): Progress made directly away from the wind vector axis (dead downwind)
    vmgMS = speedMS * Math.cos(trueWindAngle + Math.PI);
  }

  // 💾 Save the fresh calculation to global memory
  if (window.globalSimulationData.ILCA) {
    window.globalSimulationData.ILCA.vmg = vmgMS; 
  }

  // 6. Update HUD Interface Panel 
  // removed this for now ggala      <div>Bearing to Mark: ${bearingDest.toFixed(0)}°</div>
  vmgControlDiv.innerHTML = `
    <div><strong>VMG (Wind Axis)</strong></div>
    <div style="margin: 4px 0; color: blue; font-size: 14px;">${vmgMS.toFixed(2)} m/s</div>
    <hr style="border: 0; border-top: 1px solid #eee; margin: 6px 0;">
    <div style="color: green; text-align: left;">
      <div>Target: <strong>Leg ${currentLeg + 1} (${currentMarkLabel})</strong></div>
      <div>Distance to Mark:  ${distanceToTarget.toFixed(0)} m</div>
    </div>
  `;
}





