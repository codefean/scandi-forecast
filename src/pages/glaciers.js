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
            "fill-opacity": 0.05, // slightly more visible, optional
          },
        });
      }
    };

    const onLoad = () => {
      addTileset({ ...glacierTileset, fillId: FILL_LAYER_ID_1 });
      addTileset({ ...glacierTileset2, fillId: FILL_LAYER_ID_2 });

      map.setLayoutProperty(FILL_LAYER_ID_1, "visibility", "visible");
      map.setLayoutProperty(FILL_LAYER_ID_2, "visibility", "visible");

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

        const glacName = features[0].properties?.glac_name;
        if (glacName && glacName.trim() !== "") {
          popup
            .setLngLat(e.lngLat)
            .setHTML(`<div class="glacier-label">${glacName}</div>`)
            .addTo(map);
        } else {
          popup.remove();
        }
      });

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
