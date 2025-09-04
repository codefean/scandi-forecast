// src/components/Layers.js
import mapboxgl from "mapbox-gl";

export default function Layers(map) {
  // Remove existing layers if they exist (to avoid duplicates on reload)
  if (map.getLayer("frost-layer")) {
    map.removeLayer("frost-layer");
  }
  if (map.getSource("frost-live")) {
    map.removeSource("frost-live");
  }

  // Add Frost data source again (map.getSource check avoids errors)
  if (!map.getSource("frost-live")) {
    map.addSource("frost-live", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }, // will be set by MapView
    });
  }

  // Add circle layer with dynamic styling
  map.addLayer({
    id: "frost-layer",
    type: "circle",
    source: "frost-live",
    paint: {
      // Circle size based on snow depth
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["get", "snow_depth"],
        0, 4,    // 0 cm → 4px
        10, 6,   // 10 cm → 6px
        30, 10,  // 30 cm → 10px
        60, 16   // 60 cm+ → 16px
      ],

      // Circle color based on precipitation type
      "circle-color": [
        "match",
        ["get", "precipitation_type"],
        "rain", "#4a90e2",    // blue for rain
        "snow", "#ffffff",    // white for snow
        "sleet", "#a3d3ff",   // light blue for sleet
        "hail", "#7a7a7a",    // gray for hail
        /* default */ "#888888"
      ],

      // Circle stroke for better visibility
      "circle-stroke-width": 1,
      "circle-stroke-color": "#000",

      // Circle opacity based on wind speed
      "circle-opacity": [
        "interpolate",
        ["linear"],
        ["get", "wind_speed"],
        0, 0.6,
        10, 0.8,
        20, 1.0
      ],
    },
  });

  // Add popups on click for detailed info
  map.on("click", "frost-layer", e => {
    const props = e.features[0].properties;
    const coordinates = e.features[0].geometry.coordinates.slice();

    // Ensure popup shows over the correct point when map is zoomed
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const snowDepth = props.snow_depth ?? "N/A";
    const windSpeed = props.wind_speed ?? "N/A";
    const precipitation = props.precipitation_type || "none";

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(`
        <div style="font-size:14px; line-height:1.4;">
          <strong>Snow Depth:</strong> ${snowDepth} cm<br/>
          <strong>Wind Speed:</strong> ${windSpeed} m/s<br/>
          <strong>Precipitation:</strong> ${precipitation}<br/>
          <small>${props.referenceTime}</small>
        </div>
      `)
      .addTo(map);
  });

  // Change cursor to pointer when hovering over points
  map.on("mouseenter", "frost-layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "frost-layer", () => {
    map.getCanvas().style.cursor = "";
  });
}
