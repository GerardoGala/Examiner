window.globalSimulationData = {

  // --- Wind state ---
  windDirection: 0,
  windSpeed: 0,   

  // Base coordinates for the course setup
  leewardMarkLat: 13.670464,
  leewardMarkLon: 121.401286,

  // Absolute positions calculated from the previous 0.25 testing factor
  windwardMarkLat: 13.67136786,
  windwardMarkLon: 121.401286,
  
  gybeMarkLat: 13.67091593,
  gybeMarkLon: 121.40082041,

  askedAI: false,
  paused: false,


    // 🎯 The Leaflet marker instance reference
  activeMarker: null, 

  // --- UPDATED FOR 5-LEG OLYMPIC COURSE SYSTEM ---
  // 0 = Leg 1: To Windward (Beat)
  // 1 = Leg 2: To Gybe (Beam Reach)
  // 2 = Leg 3: To Leeward (Broad Reach)
  // 3 = Leg 4: To Windward (Second Beat Climb)
  // 4 = Leg 5: To Leeward (Final Dead Downwind Run Finish)
  currentLeg: 0,                                 

  // Rounded trackers increment each time a mark threshold is successfully crossed
  windwardMarkRounded: 0,  // Reaches 1 on Leg 1, reaches 2 on Leg 4!
  gybeMarkRounded: 0,      // Reaches 1 on Leg 2
  leewardMarkRounded: 0,   // Reaches 1 on Leg 3, reaches 2 at the final race finish!
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
    heading: 90,
    speed: 0,
    sailorPosition: "Mid Center",
    boomAngle: '0-8',
    daggerboard: "Center",
    vang: "Center",
    downhaul: "Base",
    outhaul: "Base",
    //slightly south of 13.670464
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
