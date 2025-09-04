// src/api/frostAPI.js

const FROST_CLIENT_ID = "12f68031-8ce7-48c7-bc7a-38b843f53711";
const FROST_CLIENT_SECRET = "08a75b8d-ca70-44a9-807d-d79421c082bf";

/**
 * Fetch weather stations from Frost API
 */
export const fetchStations = async () => {
  try {
    const frostAuth = btoa(`${FROST_CLIENT_ID}:${FROST_CLIENT_SECRET}`);
    console.log("🌍 Fetching stations from Frost API...");

    const response = await fetch(
      "/frost/sources/v0.jsonld?types=SensorSystem",
      {
        headers: {
          Authorization: `Basic ${frostAuth}`,
          Accept: "application/json",
        },
      }
    );

    console.log("🔄 Response status:", response.status);

    if (!response.ok) {
      throw new Error(`❌ Frost API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 Frost API raw data:", data);

    if (!data || !Array.isArray(data.data)) {
      console.error("🚨 Invalid Frost API response format");
      return [];
    }

    return data.data || [];
  } catch (error) {
    console.error("🚨 Error fetching Frost data:", error);
    return [];
  }
};
