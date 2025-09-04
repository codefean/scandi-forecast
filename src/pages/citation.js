import React from "react";
import "./citation.css";

const Citation = ({ stylePos }) => {
  return (
    <div className="citation-readout" style={stylePos}>
      <div>
        RGI Consortium (2023) — Randolph Glacier Inventory v7.0.{" "}
      </div>
      <div>
        Norwegian Meteorological Institute (2025) — Frost API.{" "}
      </div>
      <div>
        CMIP6 Team (2019) — Coupled Model Intercomparison Project Phase 6 (CMIP6).{" "}
      </div>
    </div>
  );
};

export default Citation;
