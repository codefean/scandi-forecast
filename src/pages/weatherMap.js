import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchStations } from "./frostAPI";
import { frostToGeoJSON } from "./geojsonUtils";
import { useGlacierLayer } from "./glaciers";
import { filterFrostStations } from "./filterFrost";
import Loc from "./loc";
import Citation from "./citation";
import "./weatherMap.css";


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

  const [loading, setLoading] = useState(true);
  const [logMessages, setLogMessages] = useState([]);
  const [progress, setProgress] = useState(0);

  // Utility: log messages + update progress bar
  const updateProgress = (msg, step, totalSteps) => {
    console.log(msg);
    setLogMessages((prev) => [...prev, msg]);
    setProgress(Math.round((step / totalSteps) * 100));
  };

  useEffect(() => {
    const initMap = async () => {
      if (mapRef.current) return;

      const totalSteps = 7;
      let step = 1;

      updateProgress("🗺️ Initializing Mapbox map...", step++, totalSteps);

      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [10.75, 67.91],
        zoom: 3.7,
      });

      await new Promise((resolve) => mapRef.current.on("load", resolve));
      updateProgress("🛰️ Mapbox map fully loaded", step++, totalSteps);

      if (!mapRef.current.getSource("mapbox-dem")) {
        mapRef.current.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
        mapRef.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.0 });
      }

      updateProgress("🔄 Fetching Frost stations...", step, totalSteps);
      const stations = await fetchStations();
      updateProgress(`📦 Stations fetched: ${stations.length}`, step++, totalSteps);

      if (stations.length === 0) {
        updateProgress("⚠️ No stations returned from Frost API", totalSteps, totalSteps);
        setLoading(false);
        return;
      }

      const allowedCountries = ["Sverige", "Norge", "Svalbard og Jan Mayen"];
      const filteredStations = stations.filter((station) =>
        allowedCountries.includes(station.country?.trim())
      );
      updateProgress(`📌 Showing ${filteredStations.length} stations after filtering by country`, step++, totalSteps);

      const stationPoints = frostToGeoJSON(filteredStations);
      updateProgress(`✅ Converted ${stationPoints.features.length} valid stations into GeoJSON.`, step++, totalSteps);

      updateProgress("🧊 Filtering stations near glaciers...", step, totalSteps);
      const stationsOnGlaciers = await filterFrostStations(stationPoints, 10);
      updateProgress(
        `🧊 Filtered ${stationsOnGlaciers.features.length} stations within 10 km of glaciers out of ${stationPoints.features.length}`,
        step++,
        totalSteps
      );

      const blob = new Blob([JSON.stringify(stationsOnGlaciers)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      if (!mapRef.current.getSource("stations")) {
        mapRef.current.addSource("stations", { type: "geojson", data: url });
        updateProgress("📡 Glacier-filtered GeoJSON source added successfully", step, totalSteps);
      }

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
        updateProgress("✅ Station layer added successfully", totalSteps, totalSteps);
      }

      mapRef.current.on("mousemove", (e) => {
        const { lng, lat } = e.lngLat;
        const elevation = mapRef.current.queryTerrainElevation(e.lngLat, {
          exaggerated: false,
        });
        setCursorInfo({
          lat,
          lng,
          elevM: elevation !== null ? elevation.toFixed(1) : "N/A",
        });
      });

      mapRef.current.on("mouseleave", () => {
        setCursorInfo({ lat: null, lng: null, elevM: null });
      });

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

      setLoading(false);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useGlacierLayer({ mapRef });

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapContainer}
        className="map-container"
        style={{ width: "100%", height: "100vh"}}
      />

      {loading && (
        <div className="loading-overlay">
          <h2 className="loading-title">🔄 Loading Glacier Data...</h2>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-percent">{progress}% Complete</p>
          <div className="log-messages">
            {logMessages.map((msg, idx) => (
              <div key={idx} className="log-message">
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}

      <Loc cursorInfo={cursorInfo} className="loc-readout" />
      <Citation
        className="citation-readout"
        stylePos={{ position: "absolute", right: 12, bottom: 25, zIndex: 2 }}
      />
    </div>
  );
};

export default WeatherStationsMap;
