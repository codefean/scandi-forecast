import React from "react";

function Legend() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        background: "rgba(0,0,0,0.6)",
        color: "white",
        padding: "10px",
        borderRadius: "8px",
        fontSize: "14px",
      }}
    >
      <b>Legend</b>
      <div>⚪ Circle size = Snow depth</div>
      <div>❄️ Snowflake = Snowfall</div>
      <div>🌬️ Wind face = Wind (rotation = speed)</div>
    </div>
  );
}

export default Legend;
