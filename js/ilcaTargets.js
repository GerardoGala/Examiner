// ilcaTargets.js

/**
 * Maps the 4 strategic wind tiers defined in proTip.html
 */
export function getWindTier(windSpeed) {
  if (windSpeed < 6.0) return "Light";               // 3 to 5 knots (and fallback below 3)
  if (windSpeed >= 6.0 && windSpeed < 15.0) return "Moderate"; // 6 to 14 knots
  return "Heavy";                                    // 15+ knots
}

// Keep this ONLY if your physics/3D models need numbers to work!
export const SIMULATION_VALUES = {
  daggerboard: { "Up": -2, "Center": 0, "Down": 2 },
  vang:        { "Ease": 2, "Center": 0, "Max": -2 }, 
  downhaul:    { "Base": 2, "Center": 0, "Max": -2 },
  outhaul:     { "Flat": 0.0, "Base": 0.5, "Full": 1.0 }
};

/**
 * Strict database mirroring the proTip.html specification matrix.
 * Updated to support Light (3-5 kn) and Moderate (6-14 kn) split!
 */
export const SCENARIO_TARGETS = {
  "Close Hauled": {
    "Light": {
      minBoom: 0, maxBoom: 8,
      sailor: "Forward", 
      daggerboard: "Down", 
      vang: "Ease",        
      downhaul: "Base", 
      outhaul: "Base" 
    },
    "Moderate": {
      minBoom: 0, maxBoom: 8,
      sailor: "Hike Hard", 
      daggerboard: "Down", 
      vang: "Center",         
      downhaul: "Base",   
      outhaul: "Base" 
    },
    "Heavy": {
      minBoom: 5, maxBoom: 15,
      sailor: "Hike Hard", 
      daggerboard: "Down", 
      vang: "Max",          
      downhaul: "Max Luff",    
      outhaul: "Flat" 
    }
  },
  "Reaching": {
    "Light": {
      minBoom: 35, maxBoom: 65,
      sailor: "Forward",   
      daggerboard: "Center", 
      vang: "Ease",          
      downhaul: "Off",    
      outhaul: "Full" 
    },
    "Moderate": {
      minBoom: 35, maxBoom: 65,
      sailor: "Hike Hard", 
      daggerboard: "Center", 
      vang: "Center",          
      downhaul: "Base",   
      outhaul: "Base" 
    },
    "Heavy": {
      minBoom: 40, maxBoom: 70,
      sailor: "Aft",       
      daggerboard: "Center", 
      vang: "Max",          
      downhaul: "Base",    
      outhaul: "Flat" 
    }
  },
  "Running": {
    "Light": {
      minBoom: 75, maxBoom: 85,
      sailor: "Forward",   
      daggerboard: "Up", 
      vang: "Center",          
      downhaul: "Off",    
      outhaul: "Full" 
    },
    "Moderate": {
      minBoom: 90, maxBoom: 90, // Strict 90° as requested in your updated HTML page
      sailor: "Mid Center",   
      daggerboard: "Up", 
      vang: "Center",          
      downhaul: "Off",    
      outhaul: "Full" 
    },
    "Heavy": {
      minBoom: 90, maxBoom: 90,
      sailor: "Aft",       
      daggerboard: "Center", 
      vang: "Center",          
      downhaul: "Center",   
      outhaul: "Full" 
    }
  }
};
