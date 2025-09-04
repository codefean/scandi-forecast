/**
 * Fetch weather stations from your backend
 */
export const fetchStations = async () => {
  try {
    console.log("🌍 Fetching stations from backend...");

    // ✅ Use your deployed backend API instead of Frost directly
    const response = await fetch(
      "https://scandi-backend.onrender.com/api/stations"
    );

    console.log("🔄 Backend response status:", response.status);

    if (!response.ok) {
      throw new Error(`❌ Backend API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 Stations fetched:", data);

    // ✅ Validate structure
    if (!data || !Array.isArray(data)) {
      console.error("🚨 Invalid backend response format");
      return [];
    }

    return data;
  } catch (error) {
    console.error("🚨 Error fetching stations:", error);
    return [];
  }
};
