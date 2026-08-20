window.globalSimulationData = {

  // --- Wind state ---
  windDirection: 0,
  windSpeed: 0,   

  // Base coordinates (The Starting / Leeward Gate Area)
  leewardMarkLat: 13.670464,
  leewardMarkLon: 121.401286,

  // 🏁 LEG 1 TARGET: Exactly 250 meters due North of Leeward
  windwardMarkLat: 13.672710,
  windwardMarkLon: 121.401286,
  
  // 🧭 LEG 2 TARGET: Symmetrical Gybe mark (125m North, 208m East)
  gybeMarkLat: 13.671587,
  gybeMarkLon: 121.402827, 


    // 🎯 The Leaflet marker instance reference
  activeMarker: null, 

  // --- UPDATED FOR 5-LEG OLYMPIC COURSE SYSTEM ---
  // 0 = Leg 1: To Windward (Beat)
  // 1 = Leg 2: To Gybe (Beam Reach)
  // 3 = Leg 4: To Leeward (Final Dead Downwind Run Finish)
  currentLeg: 0,                                 

  // Rounded trackers increment each time a mark threshold is successfully crossed
  windwardMarkRounded: 0,  // Reaches 1 on Leg 1
  gybeMarkRounded: 0,      // Reaches 1 on Leg 2
  leewardMarkRounded: 0,   // Reaches 1 on Leg 3, the finish!
  raceFinished: false,

  // 🟢 NEW: Holds references to your physical Leaflet map markers
  // Map initialization scripts should store markers here: window.globalSimulationData.markers.windward = myMarker;
  markers: {
    windward: null,
    gybe: null,
    leeward: null
  },

  // --- ILCA state ---
  ILCA: {
    maneuver: null,
    pointOfSail: "",
    heading: 45,
    speed: 0,
    sailorPosition: "Mid Center",
    boomAngle: '0-8',
    daggerboard: "Center",
    vang: "Center",
    downhaul: "Base",
    outhaul: "Base",
  
    lat: 13.670464,   
    lon: 121.401286,
    timer: 0,
    distanceToBuoy: 0,
    bearingToBuoy: 0,
    distanceToRC: 0,
    bearingToRC: 0,
    vmg: 0,
    clinometer: 0
  }
};
