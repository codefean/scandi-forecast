import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { fetchStations } from "../api/frostApi";
import "mapbox-gl/dist/mapbox-gl.css";


mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

function MapView() {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    async function loadStations() {
      try {
        const stations = await fetchStations();

        // 🔹 Log the full stations response
        console.log("Full stations response:", stations);

        // 🔹 Log just the data array
        console.log("stations.data:", stations.data);

        const geo = {
          type: "FeatureCollection",
          features: stations.data
            .filter(s => s.geometry?.coordinates)
            .map(station => ({
              type: "Feature",
              geometry: station.geometry,
              properties: {
                id: station.id,
                name: station.name,
              },
            })),
        };

        console.log("Generated GeoJSON:", geo);

        setGeojson(geo);
      } catch (err) {
        console.error("Failed to fetch stations:", err);
      }
    }

    mapObj.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [10, 64.5],
      zoom: 4.2,
    });

    mapObj.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    mapObj.current.on("load", () => {
      loadStations();
    });

    return () => mapObj.current.remove();
  }, []);

  useEffect(() => {
    if (geojson && mapObj.current) {
      if (mapObj.current.getSource("stations")) {
        mapObj.current.getSource("stations").setData(geojson);
      } else {
        mapObj.current.addSource("stations", { type: "geojson", data: geojson });

        mapObj.current.addLayer({
          id: "stations-layer",
          type: "circle",
          source: "stations",
          paint: {
            "circle-radius": 4,
            "circle-color": "#007cbf",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
          },
        });
      }
    }
  }, [geojson]);

  return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
}

export default MapView;
