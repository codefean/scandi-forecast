
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchStations } from "./frostAPI";
import { frostToGeoJSON } from "./geojsonUtils";
import { useGlacierLayer } from "./glaciers";
import Loc from "./loc";
import Citation from "./citation";

// cd /Users/seanfagan/Desktop/scandi-forecast

mapboxgl.accessToken =
  "pk.eyJ1IjoibWFwZmVhbiIsImEiOiJjbTNuOGVvN3cxMGxsMmpzNThzc2s3cTJzIn0.1uhX17BCYd65SeQsW1yibA";

const WeatherStationsMap = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const [cursorInfo, setCursorInfo] = useState({
    lat: null,
    lng: null,
    elevM: null,
  });

  useEffect(() => {
    const initMap = async () => {
      if (mapRef.current) return;

      console.log("🗺️ Initializing Mapbox map...");

      // Initialize the map
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [10.75, 59.91], // Oslo-ish
        zoom: 3.8,
      });

      // Wait for map to fully load
      await new Promise((resolve) => mapRef.current.on("load", resolve));
      console.log("🛰️ Mapbox map fully loaded");

          // ✅ Add DEM source for terrain-based elevation
    if (!mapRef.current.getSource("mapbox-dem")) {
      mapRef.current.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });

      mapRef.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.0 });
    }

      // Fetch Frost API station data
      const stations = await fetchStations();
      console.log(`📊 Total stations fetched: ${stations.length}`);

      if (stations.length === 0) {
        console.warn("⚠️ No stations returned from Frost API");
        return;
      }

      // ✅ Filter by country
      const allowedCountries = [
        "Sverige",               // Sweden
        "Norge",                 // Norway
        "Svalbard og Jan Mayen", // Svalbard
      ];

      const filteredStations = stations.filter((station) => {
        const country = station.country?.trim();
        return allowedCountries.includes(country);
      });

      console.log(`📌 Showing ${filteredStations.length} stations after filtering`);

      // Convert Frost stations to GeoJSON
      const geojson = frostToGeoJSON(filteredStations);

      // ✅ Use Blob URL to avoid Mapbox rejecting large inline GeoJSON
      const blob = new Blob([JSON.stringify(geojson)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      // Add GeoJSON source if not present
      if (!mapRef.current.getSource("stations")) {
        mapRef.current.addSource("stations", {
          type: "geojson",
          data: url,
        });
        console.log("📡 GeoJSON source added successfully");
      }

      // Add stations layer if not present
      if (!mapRef.current.getLayer("stations-layer")) {
        mapRef.current.addLayer({
          id: "stations-layer",
          type: "circle",
          source: "stations",
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0, 3,
              5, 5,
              10, 8,
              15, 14,
            ],
            "circle-color": "#0062ff",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.9,
          },
        });
        console.log("✅ Station layer added successfully");
      }



        mapRef.current.on("mousemove", (e) => {
          const { lng, lat } = e.lngLat;

          // Query terrain elevation if available
          const elevation = mapRef.current.queryTerrainElevation(e.lngLat, {
            exaggerated: false, // Set to true if you want elevation with exaggeration applied
          });

          setCursorInfo({
            lat,
            lng,
            elevM: elevation !== null ? elevation.toFixed(1) : "N/A",
          });
        });
      // Reset cursor info on mouse leave
      mapRef.current.on("mouseleave", () => {
        setCursorInfo({ lat: null, lng: null, elevM: null });
      });

      // Popup on station click
      mapRef.current.on("click", "stations-layer", (e) => {
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates;

        new mapboxgl.Popup()
          .setLngLat(coords)
          .setHTML(`
            <strong>${props.name}</strong><br/>
            ID: ${props.id || "N/A"}<br/>
            Land: ${props.country || "Ukjent"}
          `)
          .addTo(mapRef.current);
      });

mapRef.current.on("mouseenter", "stations-layer", () => {
  mapRef.current.getCanvas().style.cursor = "crosshair";
});
mapRef.current.on("mouseleave", "stations-layer", () => {
  mapRef.current.getCanvas().style.cursor = "crosshair";
});


      // Handle Mapbox rendering errors
      mapRef.current.on("error", (e) => {
        console.error("🛑 Mapbox rendering error:", e.error);
      });
    };

    initMap();

    // ✅ Cleanup on component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add glacier layer hook
  useGlacierLayer({ mapRef });

  return (
    <div style={{ position: "relative" }}>
<div
  ref={mapContainer}
  className="map-container"
  style={{ width: "100%", height: "100vh", borderRadius: "10px" }}
/>

<Loc cursorInfo={cursorInfo} className="loc-readout" />
<Citation className="citation-readout" stylePos={{ position: 'absolute', right: 12, bottom: 25, zIndex: 2 }} />

  </div>
  );
};

export default WeatherStationsMap;
