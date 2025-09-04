import React, { useEffect, useRef } from "react";

function SnowOverlay({ geojson, map }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const snowflakes = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = map.getContainer().offsetWidth;
      canvas.height = map.getContainer().offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    function drawSnow() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakes.current.forEach((flake) => {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();

        flake.y += flake.speed;
        if (flake.y > canvas.height) {
          flake.y = -flake.size;
          flake.x = Math.random() * canvas.width;
        }
      });

      animationRef.current = requestAnimationFrame(drawSnow);
    }

    drawSnow();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [map]);

  useEffect(() => {
    if (!map || !geojson) return;

    const snowStations = geojson.features.filter(
      (f) => f.properties.precipitation_type === "snow"
    );

    snowflakes.current = snowStations.flatMap((station) => {
      const px = map.project(station.geometry.coordinates);
      return Array.from({ length: 15 }).map(() => ({
        x: px.x + (Math.random() * 40 - 20),
        y: px.y + Math.random() * 200,
        size: 2 + Math.random() * 3,
        speed: 0.5 + Math.random() * 1.5,
      }));
    });
  }, [geojson, map]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    />
  );
}

export default SnowOverlay;
