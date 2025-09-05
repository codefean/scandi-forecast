import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "./glaciers.css";

const glacierTileset = {
  url: "mapbox://mapfean.bmdn0gwv",
  sourceLayer: "scandi_glaciers2",
  sourceId: "glaciers_scandi",
};

const glacierTileset2 = {
  url: "mapbox://mapfean.38aaq5bo",
  sourceLayer: "svallbard_glaciers2",
  sourceId: "glaciers_svalbard",
};

const FILL_LAYER_ID_1 = "glacier-fill-scandi";
const FILL_LAYER_ID_2 = "glacier-fill-svalbard";

export function useGlacierLayer({ mapRef }) {
  useEffect(() => {
    const map = mapRef?.current;
    if (!map) return;

    const addTileset = ({ url, sourceId, sourceLayer, fillId }) => {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: "vector", url });
      }

      if (!map.getLayer(fillId)) {
        map.addLayer({
          id: fillId,
          type: "fill",
          source: sourceId,
          "source-layer": sourceLayer,
          paint: {
            "fill-color": "#2ba0ff",
            "fill-opacity": 0.4,
          },
        });
      }
    };

    const onLoad = () => {
      // Add both glacier tilesets
      addTileset({ ...glacierTileset, fillId: FILL_LAYER_ID_1 });
      addTileset({ ...glacierTileset2, fillId: FILL_LAYER_ID_2 });

      map.setLayoutProperty(FILL_LAYER_ID_1, "visibility", "visible");
      map.setLayoutProperty(FILL_LAYER_ID_2, "visibility", "visible");

      // Create styled popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
        className: "glacier-popup",
      });

      map.on("mousemove", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [FILL_LAYER_ID_1, FILL_LAYER_ID_2],
        });

        if (!features.length) {
          popup.remove();
          return;
        }

        const props = features[0].properties;

        // Glacier name (blank if missing)
        const glacName =
          props?.glac_name && props.glac_name.trim() !== ""
            ? props.glac_name
            : "";

        // Glacier size (km²)
        const area =
          props?.area_km2 && !isNaN(props.area_km2)
            ? parseFloat(props.area_km2).toFixed(2)
            : "N/A";

        // Slope (degrees)
        const slope =
          props?.slope_deg && !isNaN(props.slope_deg)
            ? parseFloat(props.slope_deg).toFixed(1)
            : "N/A";

        // Max elevation (meters)
        const zmax =
          props?.zmax_m && !isNaN(props.zmax_m)
            ? `${parseInt(props.zmax_m, 10)} m`
            : "N/A";

        // Build styled popup HTML
        const popupHTML = `
          <div class="glacier-label">
            ${glacName ? `<h4>${glacName}</h4>` : ""}
            <div class="stats">
              <div><strong>${area}</strong> km²</div>
              <div><strong>${slope}°</strong> slope</div>
              <div><strong>${zmax}</strong> max elev</div>
            </div>
          </div>
        `;

        popup.setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
      });

      // Remove popup on mouse leave
      map.on("mouseleave", FILL_LAYER_ID_1, () => popup.remove());
      map.on("mouseleave", FILL_LAYER_ID_2, () => popup.remove());
    };

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.on("load", onLoad);
    }

    return () => {
      map.off("load", onLoad);
    };
  }, [mapRef]);
}
