// ilcaMap.js
export function drawILCAOnMap(map) {
  const ilca = window.globalSimulationData.ILCA;
  const heading = ilca.heading;

const boatSvgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g transform="rotate(${heading}, 50, 50)">
    <!-- Main Hull (Scaled 50% towards center 50,50) -->
    <polygon points="50,40 58.75,58.75 41.25,58.75" fill="white" stroke="black" stroke-width="2"/>
    <!-- Transom / Rudder detail (Scaled 50% towards center 50,50) -->
    <polygon points="45,58.75 55,58.75 52.5,61.25 47.5,61.25 46.25,60" fill="blue" stroke="black" stroke-width="2"/>
  </g>
</svg>

`;

  const parser = new DOMParser();
  const boatSvgElement = parser.parseFromString(boatSvgMarkup, "image/svg+xml").documentElement;

  const bounds = [
    [ilca.lat - 0.0002, ilca.lon - 0.0002],
    [ilca.lat + 0.0002, ilca.lon + 0.0002]
  ];

  const overlay = L.svgOverlay(boatSvgElement, bounds).addTo(map);
  overlay.bindPopup(
    `ILCA Sailboat<br>
     Heading: ${heading}°<br>
     Speed: ${ilca.speed} knots<br>
     Lat: ${ilca.lat.toFixed(5)}<br>
     Lon: ${ilca.lon.toFixed(5)}<br>
     Timer: ${ilca.timer}`
  );
}
