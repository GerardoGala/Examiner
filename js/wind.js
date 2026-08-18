// js/wind.js

// Permanent training wind
export let baseWindSpeedMS = 3.6; // 7 knots

const WIND_DIRECTION = 0; // 0° = North

// Wind strength settings
const LIGHT_WIND_KNOTS = 7;
const STRONG_WIND_KNOTS = 12;


/**
 * Start the permanent training wind.
 */
export function fetchWind() {

    // Initialize global simulation data
    window.globalSimulationData =
        window.globalSimulationData || {};

    window.globalSimulationData.windDirection =
        WIND_DIRECTION;

    // Default = light wind
    window.globalSimulationData.windSpeed =
        LIGHT_WIND_KNOTS;

    updateWindDisplay();
}


/**
 * Change the wind strength.
 */
export function setWindStrength(strength) {

    if (!window.globalSimulationData) {
        return;
    }

    if (strength === "light") {

        window.globalSimulationData.windSpeed =
            LIGHT_WIND_KNOTS;

    } else if (strength === "strong") {

        window.globalSimulationData.windSpeed =
            STRONG_WIND_KNOTS;
    }

    updateWindDisplay();
}


/**
 * Update the wind display.
 */
function updateWindDisplay() {

    const windDiv =
        document.getElementById("windStatus");

    if (windDiv) {

        const windSpeed =
            window.globalSimulationData.windSpeed;

        const windDirection =
            window.globalSimulationData.windDirection;

        windDiv.textContent =
            `🌬️ Wind: ${windSpeed} knots from ${windDirection}°`;
    }
}